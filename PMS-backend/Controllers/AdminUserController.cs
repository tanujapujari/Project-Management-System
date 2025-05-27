using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem.Data;
using ProjectManagementSystem.DTOs;
using ProjectManagementSystem.Models;

namespace ProjectManagementSystem.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Project Manager,Developer")]
    public class AdminUserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private const int DefaultPageSize = 20;
        private const int MaxPageSize = 100;
        private readonly string[] _validRoles = { "Admin", "Developer", "Project Manager" };

        public AdminUserController(ApplicationDbContext context)
        {
            _context = context;
        }

        private async Task LogActivity(int userId, string action)
        {
            var log = new ActivityLog
            {
                ActivityAction = action,
                ActivityTime = DateTime.UtcNow,
                UserId = userId,
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();
        }

        [HttpGet("all-users")]
        public async Task<IActionResult> GetAllUsers(
            [FromQuery] string? roleFilter = null,
            [FromQuery] string? searchTerm = null
        )
        {
            try
            {
                var query = _context.Users.AsQueryable();

                if (!string.IsNullOrWhiteSpace(roleFilter))
                {
                    query = query.Where(u => u.UserRole == roleFilter);
                }

                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    query = query.Where(u =>
                        u.UserName.Contains(searchTerm) || u.UserEmail.Contains(searchTerm)
                    );
                }

                var users = await query
                    .OrderBy(u => u.UserName)
                    .Select(u => new AdminUserDTO
                    {
                        UserId = u.UserId,
                        UserEmail = u.UserEmail,
                        UserFullName = u.UserName,
                        UserRole = u.UserRole,
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception)
            {
                return StatusCode(
                    500,
                    new { message = "An error occurred while retrieving users." }
                );
            }
        }

        [HttpPut("update-role/{id}")]
        public async Task<IActionResult> UpdateUserRole(int id, [FromBody] string newRole)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(newRole))
                    return BadRequest("Role cannot be empty");

                if (!_validRoles.Contains(newRole))
                    return BadRequest("Invalid role specified");

                var user = await _context.Users.FindAsync(id);
                if (user == null)
                    return NotFound("User not found");

                // Prevent changing the last admin's role
                if (user.UserRole == "Admin" && newRole != "Admin")
                {
                    var adminCount = await _context.Users.CountAsync(u => u.UserRole == "Admin");
                    if (adminCount <= 1)
                        return BadRequest("Cannot change role of the last admin user");
                }

                var oldRole = user.UserRole;
                user.UserRole = newRole;
                await _context.SaveChangesAsync();

                int adminId = int.Parse(
                    User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value
                );
                await LogActivity(
                    adminId,
                    $"Changed user role from '{oldRole}' to '{newRole}' for user '{user.UserName}'"
                );

                return Ok("User role updated successfully");
            }
            catch (Exception)
            {
                return StatusCode(
                    500,
                    new { message = "An error occurred while updating user role." }
                );
            }
        }

        [HttpDelete("delete-user/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _context
                    .Users.Include(u => u.CreatedProjects)
                    .Include(u => u.AssignedProjects)
                    .Include(u => u.AssignedTasks)
                    .FirstOrDefaultAsync(u => u.UserId == id);

                if (user == null)
                    return NotFound("User not found");

                // Check if user is the last admin
                if (user.UserRole == "Admin")
                {
                    var adminCount = await _context.Users.CountAsync(u => u.UserRole == "Admin");
                    if (adminCount <= 1)
                        return BadRequest("Cannot delete the last admin user");
                }

                if (
                    user.CreatedProjects.Any()
                    || user.AssignedProjects.Any()
                    || user.AssignedTasks.Any()
                )
                {
                    return BadRequest(
                        "Cannot delete user with associated projects or tasks. Please reassign or delete them first."
                    );
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                int adminId = int.Parse(
                    User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value
                );
                await LogActivity(adminId, $"Deleted user '{user.UserName}'");

                return Ok("User deleted successfully");
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "An error occurred while deleting user." });
            }
        }
    }
}
