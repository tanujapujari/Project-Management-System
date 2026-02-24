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
    [Route("[controller]")]
    [Authorize]
    public class TaskController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public TaskController(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        private async Task LogActivity(
            int userId,
            int projectId,
            string action,
            string? taskTitle = null,
            string? status = null
        )
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project != null)
            {
                const int maxActionLength = 250;

                string truncatedAction = action;
                if (action.Length > maxActionLength)
                {
                    truncatedAction = action.Substring(0, maxActionLength - 3) + "...";
                }

                var log = new ActivityLog
                {
                    ActivityAction = truncatedAction,
                    ActivityTime = DateTime.UtcNow,
                    UserId = userId,
                    ProjectId = projectId,
                    TaskTitle = taskTitle,
                    TaskStatus = status,
                };
                _context.ActivityLogs.Add(log);
                await _context.SaveChangesAsync();
            }
        }

        private async Task LogStatusChange(
            int userId,
            int projectId,
            string taskTitle,
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
                    $"Task Status Updated: {taskTitle} - {oldStatus} to {newStatus}",
                    taskTitle,
                    $"{oldStatus}→{newStatus}"
                );
            }
        }

        private async Task SendTaskEmail(
            string userEmail,
            string userName,
            string subject,
            string taskTitle,
            string taskStatus,
            string taskPriority,
            string projectTitle,
            string additionalInfo = ""
        )
        {
            if (!string.IsNullOrEmpty(userEmail))
            {
                var body =
                    $@"<h3>Hello {userName},</h3>
                    <p>{subject}:</p>
                    <ul>
                        <li><strong>Title:</strong> {taskTitle}</li>
                        <li><strong>Status:</strong> {taskStatus}</li>
                        <li><strong>Priority:</strong> {taskPriority}</li>
                        <li><strong>Project:</strong> {projectTitle}</li>
                        {additionalInfo}
                    </ul>
                    <p>Please check the Project Management System for more details.</p>";

                await _emailService.SendEmailAsync(userEmail, subject, body);
            }
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin, Project Manager")]
        public async Task<IActionResult> CreateTask([FromBody] TaskItemDTO dto)
        {
            if (dto == null)
                return BadRequest("Invalid task data");

            var project = await _context.Projects.FindAsync(dto.ProjectId);
            if (project == null)
                return BadRequest("Project not found");

            var assignedUser = await _context.Users.FindAsync(dto.AssignedUserId);
            if (assignedUser == null)
                return BadRequest("Assigned user not found");

            var task = new TaskItem
            {
                TaskTitle = dto.TaskTitle,
                TaskDescription = dto.TaskDescription,
                TaskStatus = dto.TaskStatus,
                TaskPriority = dto.TaskPriority,
                ProjectId = dto.ProjectId,
                AssignedUserId = dto.AssignedUserId,
                CreatedAt = DateTime.UtcNow,
            };

            _context.TaskItems.Add(task);
            await _context.SaveChangesAsync();

            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            await LogActivity(
                userId,
                task.ProjectId,
                $"Task Created: {task.TaskTitle}",
                task.TaskTitle,
                task.TaskStatus
            );

            await SendTaskEmail(
                assignedUser.UserEmail,
                assignedUser.UserName,
                $"New Task Assigned: {task.TaskTitle}",
                task.TaskTitle,
                task.TaskStatus,
                task.TaskPriority,
                project.ProjectTitle,
                $"You've been assigned to task '{task.TaskTitle}'."
            );

            return Ok("Task created successfully.");
        }

        [HttpGet("get")]
        [Authorize(Roles = "Admin, Project Manager, Developer")]
        public IActionResult GetAllTasks()
        {
            var tasks = _context
                .TaskItems.Select(task => new TaskItemDTO
                {
                    TaskItemId = task.TaskItemId,
                    TaskTitle = task.TaskTitle,
                    TaskDescription = task.TaskDescription,
                    TaskStatus = task.TaskStatus,
                    TaskPriority = task.TaskPriority,
                    ProjectId = task.ProjectId,
                    AssignedUserId = task.AssignedUserId,
                    CreatedAt = task.CreatedAt.ToString("dd-MM-yyyy"),
                    Comments = task
                        .Comments.OrderByDescending(c => c.CommentId)
                        .Select(c => new CommentDTO
                        {
                            CommentId = c.CommentId,
                            CommentContent = c.CommentContent,
                            CommentedById = c.CommentedById,
                            CreatedAt = c.CreatedAt,
                        })
                        .ToList(),
                })
                .ToList();

            return Ok(tasks);
        }

        [HttpGet("get/{id}")]
        [Authorize(Roles = "Admin, Project Manager, Developer")]
        public async Task<IActionResult> GetTaskById(int id)
        {
            var task = await _context
                .TaskItems.Include(t => t.Comments)
                .ThenInclude(c => c.CommentedByAuthor)
                .Where(t => t.TaskItemId == id)
                .Select(t => new TaskItemDTO
                {
                    TaskItemId = t.TaskItemId,
                    TaskTitle = t.TaskTitle,
                    TaskDescription = t.TaskDescription,
                    TaskStatus = t.TaskStatus,
                    TaskPriority = t.TaskPriority,
                    ProjectId = t.ProjectId,
                    AssignedUserId = t.AssignedUserId,
                    CreatedAt = t.CreatedAt.ToString("dd-MM-yyyy"),
                    Comments = t
                        .Comments.OrderByDescending(c => c.CommentId)
                        .Select(c => new CommentDTO
                        {
                            CommentId = c.CommentId,
                            CommentContent = c.CommentContent,
                            CommentedById = c.CommentedById,
                            CommentedByName =
                                c.CommentedByAuthor != null
                                    ? c.CommentedByAuthor.UserName
                                    : string.Empty,
                        })
                        .ToList(),
                })
                .FirstOrDefaultAsync();

            if (task == null)
                return NotFound("Task not found");

            return Ok(task);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin, Project Manager")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskItemDTO dto)
        {
            if (dto == null)
                return BadRequest("Invalid task data");

            var task = await _context.TaskItems.FindAsync(id);
            if (task == null)
                return NotFound("Task not found");

            var project = await _context.Projects.FindAsync(dto.ProjectId);
            if (project == null)
                return BadRequest("Project not found");

            var assignedUser = await _context.Users.FindAsync(dto.AssignedUserId);
            if (assignedUser == null)
                return BadRequest("Assigned user not found");

            var oldStatus = task.TaskStatus;
            var statusChanged = oldStatus != dto.TaskStatus;

            task.TaskTitle = dto.TaskTitle;
            task.TaskDescription = dto.TaskDescription;
            task.TaskStatus = dto.TaskStatus;
            task.TaskPriority = dto.TaskPriority;
            task.ProjectId = dto.ProjectId;
            task.AssignedUserId = dto.AssignedUserId;

            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            const int maxLogTaskTitleLength = 150;
            string logTaskTitle = task.TaskTitle;
            if (logTaskTitle.Length > maxLogTaskTitleLength)
            {
                logTaskTitle = logTaskTitle.Substring(0, maxLogTaskTitleLength - 3) + "...";
            }

            if (statusChanged)
            {
                await LogStatusChange(
                    userId,
                    task.ProjectId,
                    logTaskTitle,
                    oldStatus,
                    dto.TaskStatus
                );
            }
            else
            {
                await LogActivity(
                    userId,
                    task.ProjectId,
                    $"Task Updated: {logTaskTitle}",
                    logTaskTitle,
                    task.TaskStatus
                );
            }

            await _context.SaveChangesAsync();
            return Ok("Task updated successfully");
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _context.TaskItems.FindAsync(id);
            if (task == null)
                return NotFound("Task not found.");

            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            await LogActivity(
                userId,
                task.ProjectId,
                $"Task Deleted: {task.TaskTitle}",
                task.TaskTitle,
                task.TaskStatus
            );

            _context.TaskItems.Remove(task);
            await _context.SaveChangesAsync();

            return Ok("Task deleted successfully.");
        }
    }
}
