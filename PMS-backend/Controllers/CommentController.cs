using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem.Data;
using ProjectManagementSystem.DTOs;
using ProjectManagementSystem.Models;

namespace ProjectManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CommentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CommentController(ApplicationDbContext context)
        {
            _context = context;
        }

        private async Task LogActivity(
            int userId,
            int projectId,
            string action,
            string? commentContent = null
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
                    CommentContent = commentContent,
                };
                _context.ActivityLogs.Add(log);
                await _context.SaveChangesAsync();
            }
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAll()
        {
            var comments = await _context
                .Comments.Include(c => c.CommentedByAuthor)
                .Include(c => c.RelatedTaskItem)
                .Include(c => c.RelatedProject)
                .Select(c => new CommentDTO
                {
                    CommentId = c.CommentId,
                    CommentContent = c.CommentContent,
                    TaskItemId = c.TaskItemId,
                    RelatedTaskTitle =
                        c.RelatedTaskItem != null ? c.RelatedTaskItem.TaskTitle : null,
                    ProjectId = c.ProjectId,
                    RelatedProjectTitle =
                        c.RelatedProject != null ? c.RelatedProject.ProjectTitle : null,
                    CommentedById = c.CommentedById,
                    CommentedByName =
                        c.CommentedByAuthor != null ? c.CommentedByAuthor.UserName : null,
                    CreatedAt = c.CreatedAt,
                })
                .ToListAsync();

            return Ok(comments);
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateComment([FromBody] CommentDTO dto)
        {
            if (dto == null)
                return BadRequest("Invalid comment data");

            if (string.IsNullOrWhiteSpace(dto.CommentContent))
                return BadRequest("Comment content is required");

            if (dto.TaskItemId == null && dto.ProjectId == null)
                return BadRequest("Comment must be associated with either a task or a project");

            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            int projectId = 0;

            if (dto.TaskItemId.HasValue)
            {
                var task = await _context.TaskItems.FirstOrDefaultAsync(t =>
                    t.TaskItemId == dto.TaskItemId
                );
                if (task == null)
                    return NotFound("Task not found");
                projectId = task.ProjectId;
            }
            else if (dto.ProjectId.HasValue)
            {
                var project = await _context.Projects.FirstOrDefaultAsync(p =>
                    p.ProjectId == dto.ProjectId
                );
                if (project == null)
                    return NotFound("Project not found");
                projectId = project.ProjectId;
            }

            var user = await _context.Users.FindAsync(dto.CommentedById);
            if (user == null)
                return NotFound("User not found");

            var comment = new Comment
            {
                CommentContent = dto.CommentContent,
                TaskItemId = dto.TaskItemId,
                ProjectId = dto.ProjectId,
                CommentedById = dto.CommentedById,
                CreatedAt = DateTime.UtcNow,
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            await LogActivity(
                userId,
                projectId,
                $"Comment Added: {comment.CommentContent?.Substring(0, Math.Min(50, comment.CommentContent.Length))}...",
                comment.CommentContent
            );

            dto.CommentId = comment.CommentId;
            dto.CreatedAt = comment.CreatedAt;
            return Ok(dto);
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateComment(int id, [FromBody] CommentDTO dto)
        {
            if (dto == null)
                return BadRequest("Invalid comment data");

            if (string.IsNullOrWhiteSpace(dto.CommentContent))
                return BadRequest("Comment content is required");

            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var comment = await _context
                .Comments.Include(c => c.RelatedTaskItem)
                .Include(c => c.RelatedProject)
                .FirstOrDefaultAsync(c => c.CommentId == id);

            if (comment == null)
                return NotFound("Comment not found");

            if (comment.CommentedById != userId)
            {
                var user = await _context.Users.FindAsync(userId);
                if (user?.UserRole != "Admin")
                    return Forbid("You are not authorized to update this comment");
            }

            comment.CommentContent = dto.CommentContent;
            await _context.SaveChangesAsync();

            await LogActivity(
                userId,
                comment.ProjectId ?? 0,
                $"Comment Updated: {comment.CommentContent?.Substring(0, Math.Min(50, comment.CommentContent.Length))}...",
                comment.CommentContent
            );

            return Ok("Comment updated successfully");
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteComment(int id)
        {
            var comment = await _context.Comments.FindAsync(id);
            if (comment == null)
                return NotFound("Comment not found.");

            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            await LogActivity(
                userId,
                comment.ProjectId ?? 0,
                $"Comment Deleted: {comment.CommentContent?.Substring(0, Math.Min(50, comment.CommentContent.Length))}...",
                comment.CommentContent
            );

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            return Ok("Comment deleted successfully.");
        }
    }
}
