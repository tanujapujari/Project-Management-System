using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ProjectManagementSystem.Data;
using ProjectManagementSystem.DTOs;
using ProjectManagementSystem.Models;
using ProjectManagementSystem.Services;

namespace ProjectManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PasswordController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PasswordController> _logger;
        private readonly IAuthService _authService;
        private const int MaxResetAttemptsPerHour = 3;
        private const int TokenExpiryHours = 1;

        public PasswordController(
            ApplicationDbContext context,
            IEmailService emailService,
            IConfiguration configuration,
            ILogger<PasswordController> logger,
            IAuthService authService
        )
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
            _authService = authService;
        }

        private bool IsPasswordValid(string password)
        {
            if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
                return false;

            var hasNumber = new Regex(@"[0-9]+");
            var hasUpperChar = new Regex(@"[A-Z]+");
            var hasLowerChar = new Regex(@"[a-z]+");
            var hasSpecialChar = new Regex(@"[!@#$%^&*(),.?""':{}|<>]");

            return hasNumber.IsMatch(password)
                && hasUpperChar.IsMatch(password)
                && hasLowerChar.IsMatch(password)
                && hasSpecialChar.IsMatch(password);
        }

        private async Task<bool> IsPasswordReused(int userId, byte[] newHash)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return false;

            return user.UserPasswordHash != null && user.UserPasswordHash.SequenceEqual(newHash);
        }

        private async Task CleanupExpiredTokens()
        {
            var expiredTokens = await _context
                .PasswordResetTokens.Where(t => t.ExpiryTime <= DateTime.UtcNow)
                .ToListAsync();

            if (expiredTokens.Any())
            {
                _context.PasswordResetTokens.RemoveRange(expiredTokens);
                await _context.SaveChangesAsync();
            }
        }

        [AllowAnonymous]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDTO request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.UserEmail))
                {
                    return BadRequest("Email address is required");
                }

                // Check rate limiting
                var recentAttempts = await _context.PasswordResetTokens.CountAsync(t =>
                    t.UserEmail == request.UserEmail && t.ExpiryTime > DateTime.UtcNow.AddHours(-1)
                );

                if (recentAttempts >= MaxResetAttemptsPerHour)
                {
                    _logger.LogWarning(
                        $"Too many password reset attempts for email: {request.UserEmail}"
                    );
                    return StatusCode(
                        429,
                        "Too many password reset attempts. Please try again later."
                    );
                }

                var user = await _context.Users.FirstOrDefaultAsync(u =>
                    u.UserEmail == request.UserEmail
                );
                if (user == null)
                {
                    _logger.LogWarning(
                        $"Password reset requested for non-existent email: {request.UserEmail}"
                    );
                    return Ok(
                        "If an account with that email exists, a password reset link has been sent."
                    );
                }

                await CleanupExpiredTokens();

                var tokenBytes = new byte[64];
                using var rng = RandomNumberGenerator.Create();
                rng.GetBytes(tokenBytes);

                var token = Convert.ToBase64String(tokenBytes);
                var tokenHash = HashToken(token);

                var resetToken = new PasswordResetToken
                {
                    UserId = user.UserId,
                    UserEmail = user.UserEmail,
                    TokenHash = tokenHash,
                    ExpiryTime = DateTime.UtcNow.AddHours(TokenExpiryHours),
                };

                _context.PasswordResetTokens.Add(resetToken);

                await _context.SaveChangesAsync();

                string frontendUrl =
                    _configuration["FrontendSettings:Url"] ?? "http://localhost:5173";
                string resetLink =
                    $"{frontendUrl}/resetPassword?token={Uri.EscapeDataString(token)}";
                string emailBody =
                    $@"<h3>Password Reset Request</h3>
                    <p>You have requested to reset your password. Click the link below to proceed:</p>
                    <p><a href='{resetLink}'>{resetLink}</a></p>
                    <p>This link will expire in {TokenExpiryHours} hour(s).</p>
                    <p>If you did not request this password reset, please ignore this email.</p>";

                await _emailService.SendEmailAsync(
                    request.UserEmail,
                    "Password Reset Request",
                    emailBody
                );

                _logger.LogInformation($"Reset link sent to {request.UserEmail}");
                return Ok(
                    "If an account with that email exists, a password reset link has been sent."
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    $"Error processing forgot password for {request.UserEmail}: {ex.Message}"
                );
                return StatusCode(
                    500,
                    "An error occurred while processing your request. Please try again later."
                );
            }
        }

        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDTO request)
        {
            try
            {
                if (
                    string.IsNullOrWhiteSpace(request.Token)
                    || string.IsNullOrWhiteSpace(request.NewPassword)
                )
                {
                    return BadRequest("Token and new password are required");
                }

                if (!IsPasswordValid(request.NewPassword))
                {
                    return BadRequest(
                        "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character"
                    );
                }

                var decodedToken = Uri.UnescapeDataString(request.Token);
                var tokenHashToCheck = HashToken(decodedToken);

                var resetToken = await _context.PasswordResetTokens.FirstOrDefaultAsync(t =>
                    t.TokenHash == tokenHashToCheck && t.ExpiryTime > DateTime.UtcNow
                );

                if (resetToken == null)
                {
                    _logger.LogWarning("Invalid or expired reset token");
                    return BadRequest("Invalid or expired token");
                }

                var user = await _context.Users.FirstOrDefaultAsync(u =>
                    u.UserId == resetToken.UserId
                );
                if (user == null)
                {
                    _logger.LogError($"User not found for reset token");
                    return NotFound("User not found");
                }

                // Generate new password hash and salt
                _authService.CreatePasswordHash(
                    request.NewPassword,
                    out byte[] newHash,
                    out byte[] newSalt
                );

                if (await IsPasswordReused(user.UserId, newHash))
                {
                    return BadRequest("New password must be different from the current password");
                }

                user.UserPasswordHash = newHash;
                user.UserPasswordSalt = newSalt;

                _context.PasswordResetTokens.Remove(resetToken);

                await CleanupExpiredTokens();

                await _context.SaveChangesAsync();

                string emailBody =
                    $@"<h3>Password Reset Successful</h3>
                    <p>Your password has been successfully reset.</p>
                    <p>If you did not make this change, please contact support immediately.</p>";

                await _emailService.SendEmailAsync(
                    user.UserEmail,
                    "Password Reset Successful",
                    emailBody
                );

                _logger.LogInformation($"Password reset successful for {user.UserEmail}");
                return Ok("Password has been reset successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error resetting password: {ex.Message}");
                return StatusCode(
                    500,
                    "An error occurred while resetting your password. Please try again later."
                );
            }
        }

        private string HashToken(string token)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(token);
            return Convert.ToBase64String(sha256.ComputeHash(bytes));
        }
    }
}
