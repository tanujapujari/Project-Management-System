using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProjectManagementSystem.Data;
using ProjectManagementSystem.DTOs;
using ProjectManagementSystem.DTOs.Auth;
using ProjectManagementSystem.Models;
using ProjectManagementSystem.Services;

namespace ProjectManagementSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(
        ApplicationDbContext context,
        IConfiguration configuration,
        IAuthService authService
    ) : ControllerBase
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IConfiguration _configuration = configuration;
        private readonly IAuthService _authService = authService;
        private readonly string[] _validRoles = ["Admin", "Developer", "ProjectManager"];

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<object>> Login(LoginDTO dto)
        {
            try
            {
                if (
                    string.IsNullOrEmpty(dto.UserEmail)
                    || string.IsNullOrEmpty(dto.Password)
                    || string.IsNullOrEmpty(dto.UserRole)
                )
                {
                    return BadRequest("Please provide email, password, and role.");
                }

                if (!_validRoles.Contains(dto.UserRole.Trim(), StringComparer.OrdinalIgnoreCase))
                {
                    return BadRequest("Invalid role specified.");
                }

                var user = await _context.Users.FirstOrDefaultAsync(x =>
                    x.UserEmail == dto.UserEmail
                );
                if (user == null)
                {
                    Console.WriteLine($"Login failed: User not found with email {dto.UserEmail}");
                    return Unauthorized(new { message = "Invalid email" });
                }

                if (user.UserPasswordHash == null || user.UserPasswordSalt == null)
                {
                    Console.WriteLine(
                        $"Login failed: Password hash or salt is null for user {dto.UserEmail}"
                    );
                    return Unauthorized(new { message = "Invalid user credentials" });
                }

                var isPasswordValid = _authService.VerifyPasswordHash(
                    dto.Password,
                    user.UserPasswordHash,
                    user.UserPasswordSalt
                );

                if (!isPasswordValid)
                {
                    Console.WriteLine($"Login failed: Invalid password for user {dto.UserEmail}");
                    return Unauthorized(new { message = "Invalid password" });
                }

                if (
                    !user
                        .UserRole.Trim()
                        .Equals(dto.UserRole.Trim(), StringComparison.OrdinalIgnoreCase)
                )
                {
                    Console.WriteLine(
                        $"Login failed: Role mismatch for user {dto.UserEmail}. Expected: {user.UserRole}, Got: {dto.UserRole}"
                    );
                    return Unauthorized(new { message = "User is not assigned to this role" });
                }

                var accessToken = CreateToken(user);

                var refreshTokenRaw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
                var refreshTokenHash = HashToken(refreshTokenRaw);
                var refreshTokenExpiry = DateTime.UtcNow.AddDays(7);

                var refreshToken = new RefreshToken
                {
                    TokenHash = refreshTokenHash,
                    ExpiryTime = refreshTokenExpiry,
                    UserId = user.UserId,
                    UserEmail = user.UserEmail,
                    IsRevoked = false,
                    IsUsed = false,
                };

                _context.RefreshTokens.Add(refreshToken);
                await _context.SaveChangesAsync();

                Console.WriteLine($"Login successful for user {dto.UserEmail}");
                return Ok(
                    new
                    {
                        message = "Login Successful!",
                        accessToken,
                        refreshToken = refreshTokenRaw,
                        userId = user.UserId,
                        userName = user.UserName,
                        userRole = user.UserRole,
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Login error: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred during login" });
            }
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<ActionResult<string>> Register(RegisterUserDTO dto)
        {
            string trimmedUsername =
                dto.UserName?.Trim() ?? throw new ArgumentNullException(nameof(dto.UserName));
            string trimmedEmail =
                dto.UserEmail?.Trim() ?? throw new ArgumentNullException(nameof(dto.UserEmail));
            string trimmedRole =
                dto.UserRole?.Trim() ?? throw new ArgumentNullException(nameof(dto.UserRole));

            if (!_validRoles.Contains(trimmedRole, StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Invalid role specified." });
            }

            if (await _context.Users.AnyAsync(x => x.UserEmail == trimmedEmail))
                return BadRequest(new { message = "Email already exists!" });

            if (await _context.Users.AnyAsync(x => x.UserName == trimmedUsername))
                return BadRequest(new { message = "Username already exists!" });

            _authService.CreatePasswordHash(dto.Password, out byte[] hash, out byte[] salt);

            var user = new User
            {
                UserName = trimmedUsername,
                UserPasswordHash = hash,
                UserPasswordSalt = salt,
                UserRole = trimmedRole,
                UserEmail = trimmedEmail,
            };

            _context.Users.Add(user);
            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "User registered successfully." });
            }
            catch (DbUpdateException)
            {
                return StatusCode(
                    500,
                    new { message = "An error occurred while saving the user." }
                );
            }
            catch (Exception)
            {
                return StatusCode(
                    500,
                    new { message = "An unexpected error occurred during registration." }
                );
            }
        }

        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshRequestDTO request)
        {
            var principal = _authService.GetPrincipalFromExpiredToken(request.AccessToken);
            if (principal == null)
                return BadRequest("Invalid access token.");

            int userId = int.Parse(principal.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
                return NotFound("User not found.");

            var hashedRefreshToken = HashToken(request.RefreshToken);
            var tokenEntry = await _context.RefreshTokens.FirstOrDefaultAsync(t =>
                t.UserId == userId
                && t.TokenHash == hashedRefreshToken
                && !t.IsRevoked
                && !t.IsUsed
                && t.ExpiryTime > DateTime.UtcNow
            );

            if (tokenEntry == null)
                return BadRequest("Invalid or expired refresh token.");

            // Mark the old token as used and revoked
            tokenEntry.IsUsed = true;
            tokenEntry.IsRevoked = true;

            // Create and save a new token
            string newRefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            string newHashedToken = HashToken(newRefreshToken);

            var newTokenEntry = new RefreshToken
            {
                TokenHash = newHashedToken,
                ExpiryTime = DateTime.UtcNow.AddDays(7),
                UserId = user.UserId,
                UserEmail = user.UserEmail,
                IsRevoked = false,
                IsUsed = false,
            };

            _context.RefreshTokens.Add(newTokenEntry);
            await _context.SaveChangesAsync();

            return Ok(
                new LoginResponseDTO
                {
                    AccessToken = _authService.GenerateAccessToken(user),
                    RefreshToken = newRefreshToken,
                }
            );
        }

        [Authorize]
        [HttpGet("test-auth")]
        public IActionResult TestAuth()
        {
            return Ok("🎉 You're authenticated!");
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogOutDTO request)
        {
            if (string.IsNullOrEmpty(request.RefreshToken))
                return BadRequest("Refresh token is required.");

            var hashedToken = HashToken(request.RefreshToken);
            var tokenEntry = await _context.RefreshTokens.FirstOrDefaultAsync(x =>
                x.TokenHash == hashedToken && x.ExpiryTime > DateTime.UtcNow
            );

            if (tokenEntry == null)
                return NotFound("Token not found or expired.");

            _context.RefreshTokens.Remove(tokenEntry);
            await _context.SaveChangesAsync();

            return Ok("Logged out successfully.");
        }

        private string CreateToken(User user)
        {
            var jwtKey = _configuration["JWT:Key"];
            if (string.IsNullOrEmpty(jwtKey))
            {
                throw new InvalidOperationException("JWT:Key is missing from configuration.");
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Role, user.UserRole),
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

            var token = new JwtSecurityToken(
                issuer: _configuration["JWT:Issuer"],
                audience: _configuration["JWT:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string HashToken(string token)
        {
            using var sha256 = SHA256.Create();
            var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
            return Convert.ToBase64String(hashBytes);
        }
    }
}
