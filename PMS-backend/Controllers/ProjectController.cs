using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem.Data;
using ProjectManagementSystem.DTOs;
using ProjectManagementSystem.Models;
using ProjectManagementSystem.Services;

namespace ProjectManagementSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin, Project Manager, Developer")]
    public class ProjectController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly string[] _validProjectStatuses =
        {
            "Not Started",
            "Upcoming",
            "In Progress",
            "On Hold",
            "Completed",
            "Cancelled",
        };

        public ProjectController(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        private async Task LogActivity(
            int userId,
            int projectId,
            string action,
            string? status = null
        )
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project != null)
            {
                var log = new ActivityLog
                {
                    ActivityAction = action,
                    ActivityTime = DateTime.UtcNow,
                    UserId = userId,
                    ProjectId = projectId,
                    ProjectStatus = status,
                };
                _context.ActivityLogs.Add(log);
                await _context.SaveChangesAsync();
            }
        }

        private async Task LogStatusChange(
            int userId,
            int projectId,
            string oldStatus,
            string newStatus
        )
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project != null)
            {
                await LogActivity(
                    userId,
                    projectId,
                    $"Project Status Updated: {project.ProjectTitle} - {oldStatus} to {newStatus}",
                    $"{oldStatus}→{newStatus}"
                );
            }
        }

        private async Task SendProjectEmail(
            string userEmail,
            string userName,
            string subject,
            string projectTitle,
            string message
        )
        {
            try
            {
                await _emailService.SendEmailAsync(
                    userEmail,
                    subject,
                    $"Hi {userName},\n\n{message}\n\nThanks!"
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send email to {userEmail}: {ex.Message}");
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateProject([FromBody] CreateProjectDTO dto)
        {
            if (dto == null)
                return BadRequest("Invalid project data");

            if (string.IsNullOrWhiteSpace(dto.ProjectTitle))
                return BadRequest("Project title is required");

            var startDate = dto.ProjectStartDate;
            var deadline = dto.ProjectDeadLine;

            if (deadline <= startDate)
                return BadRequest("Project deadline must be after start date");

            if (!_validProjectStatuses.Contains(dto.ProjectStatus))
                return BadRequest("Invalid project status");

            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            if (await _context.Projects.AnyAsync(p => p.ProjectTitle == dto.ProjectTitle))
                return BadRequest("Project title already exists");

            var creator = await _context.Users.FindAsync(dto.CreatedByUserId);
            if (creator == null)
                return BadRequest("Project creator not found");

            var assignedUsers = await _context
                .Users.Where(u => dto.AssignedUserIds.Contains(u.UserId))
                .ToListAsync();

            if (!assignedUsers.Any())
                return BadRequest("At least one user must be assigned to the project");

            var project = new Project
            {
                ProjectTitle = dto.ProjectTitle,
                ProjectDescription = dto.ProjectDescription,
                ProjectStartDate = startDate,
                ProjectDeadLine = deadline,
                ProjectStatus = dto.ProjectStatus,
                CreatedByUserId = dto.CreatedByUserId,
                Users = assignedUsers,
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            await LogActivity(
                userId,
                project.ProjectId,
                $"Project Created: {project.ProjectTitle}",
                dto.ProjectStatus
            );

            foreach (var user in assignedUsers)
            {
                await SendProjectEmail(
                    user.UserEmail,
                    user.UserName,
                    $"Assigned to Project: {project.ProjectTitle}",
                    project.ProjectTitle,
                    $"You've been assigned to project '{project.ProjectTitle}' with deadline {project.ProjectDeadLine:dd-MM-yyyy}."
                );
            }

            return Ok("Project created successfully.");
        }

        [HttpGet("get")]
        [Authorize]
        public async Task<IActionResult> GetProjects()
        {
            try
            {
                var projects = await _context
                    .Projects.Include(p => p.Users)
                    .Include(p => p.CreatedByUser)
                    .Select(p => new ProjectDTO
                    {
                        ProjectId = p.ProjectId,
                        ProjectTitle = p.ProjectTitle,
                        ProjectDescription = p.ProjectDescription,
                        ProjectStartDate = p.ProjectStartDate,
                        ProjectDeadLine = p.ProjectDeadLine,
                        ProjectStatus = p.ProjectStatus,
                        CreatedByUserId = p.CreatedByUserId,
                        CreatedByUserName = p.CreatedByUser.UserName,
                        AssignedUserIds = p.Users.Select(u => u.UserId).ToList(),
                    })
                    .ToListAsync();
                return Ok(projects);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching projects: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(
                    500,
                    "An error occurred while fetching projects. Please try again."
                );
            }
        }

        [HttpGet("get/{id}")]
        [Authorize]
        public async Task<IActionResult> GetProjectById(int id)
        {
            var project = await _context
                .Projects.Include(p => p.Users)
                .FirstOrDefaultAsync(p => p.ProjectId == id);

            if (project == null)
                return NotFound("Project not found.");
            return Ok(project);
        }

        [HttpGet("user-projects")]
        [Authorize]
        public async Task<IActionResult> GetUserProjects()
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var projects = await _context
                .Projects.Include(p => p.Users)
                .Where(p => p.Users.Any(u => u.UserId == userId))
                .ToListAsync();

            return Ok(projects);
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] UpdateProjectDTO dto)
        {
            if (dto == null)
                return BadRequest("Invalid project data");

            try
            {
                var project = await _context
                    .Projects.Include(p => p.Users)
                    .FirstOrDefaultAsync(p => p.ProjectId == id);

                if (project == null)
                    return NotFound("Project not found");

                var oldStatus = project.ProjectStatus;
                var statusChanged = oldStatus != dto.ProjectStatus;

                project.ProjectTitle = dto.ProjectTitle;
                project.ProjectDescription = dto.ProjectDescription;
                project.ProjectStartDate = dto.ProjectStartDate;
                project.ProjectDeadLine = dto.ProjectDeadLine;
                project.ProjectStatus = dto.ProjectStatus;
                project.CreatedByUserId = dto.CreatedByUserId;

                var newAssignedUsers = await _context
                    .Users.Where(u => dto.AssignedUserIds.Contains(u.UserId))
                    .ToListAsync();

                if (!newAssignedUsers.Any())
                    return BadRequest("At least one user must be assigned to the project");

                project.Users.Clear();

                foreach (var user in newAssignedUsers)
                {
                    project.Users.Add(user);
                }

                await _context.SaveChangesAsync();

                if (statusChanged)
                {
                    await LogStatusChange(
                        dto.CreatedByUserId,
                        project.ProjectId,
                        oldStatus,
                        dto.ProjectStatus
                    );
                }
                else
                {
                    await LogActivity(
                        dto.CreatedByUserId,
                        project.ProjectId,
                        $"Project Updated: {project.ProjectTitle}",
                        dto.ProjectStatus
                    );
                }

                return Ok(
                    new
                    {
                        message = "Project updated successfully",
                        project = new
                        {
                            projectId = project.ProjectId,
                            projectTitle = project.ProjectTitle,
                            projectDescription = project.ProjectDescription,
                            projectStatus = project.ProjectStatus,
                            projectStartDate = project.ProjectStartDate,
                            projectDeadLine = project.ProjectDeadLine,
                            createdByUserId = project.CreatedByUserId,
                            assignedUserIds = project.Users.Select(u => u.UserId).ToList(),
                        },
                    }
                );
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine($"Error updating project: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(
                    500,
                    "An error occurred while updating the project. Please try again."
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Unexpected error: {ex.Message}");
                return StatusCode(500, "An unexpected error occurred. Please try again.");
            }
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var project = await _context
                .Projects.Include(p => p.Users)
                .FirstOrDefaultAsync(p => p.ProjectId == id);

            if (project == null)
                return NotFound("Project not found.");

            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            await LogActivity(
                userId,
                project.ProjectId,
                $"Project Deleted: {project.ProjectTitle}",
                project.ProjectStatus
            );

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            foreach (var user in project.Users)
            {
                await SendProjectEmail(
                    user.UserEmail,
                    user.UserName,
                    $"Project Deleted: {project.ProjectTitle}",
                    project.ProjectTitle,
                    $"The project '{project.ProjectTitle}' has been deleted."
                );
            }

            return Ok("Project deleted successfully.");
        }
    }
}
