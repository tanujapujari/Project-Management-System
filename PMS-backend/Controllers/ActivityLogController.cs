using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem.Data;
using ProjectManagementSystem.DTOs;

namespace ProjectManagementSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin, Project Manager, Developer")]
    public class ActivityLogController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ActivityLogController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("get")]
        public async Task<ActionResult<IEnumerable<ActivityLogDTO>>> GetLogs()
        {
            try
            {
                var logs = await _context
                    .ActivityLogs.Include(l => l.ActivityUser)
                    .Include(l => l.AssociatedProject)
                    .OrderByDescending(l => l.ActivityTime)
                    .Select(l => new ActivityLogDTO
                    {
                        ActivityLogId = l.ActivityLogId,
                        ActivityAction = l.ActivityAction,
                        ActivityTime = l.ActivityTime,
                        UserName = l.ActivityUser != null ? l.ActivityUser.UserName : null,
                        ProjectTitle =
                            l.AssociatedProject != null ? l.AssociatedProject.ProjectTitle : null,
                        TaskTitle = l.ActivityAction.ToLower().Contains("task")
                            ? l.TaskTitle
                            : null,
                        TaskStatus = l.TaskStatus,
                        CommentContent = l.ActivityAction.ToLower().Contains("comment")
                            ? l.CommentContent
                            : null,
                        ProjectStatus = l.ProjectStatus,
                    })
                    .ToListAsync();

                return Ok(logs);
            }
            catch (Exception)
            {
                return StatusCode(
                    500,
                    new { message = "An error occurred while retrieving activity logs." }
                );
            }
        }

        [HttpGet("get-by-project/{projectId}")]
        public async Task<ActionResult<IEnumerable<ActivityLogDTO>>> GetProjectLogs(int projectId)
        {
            try
            {
                var logs = await _context
                    .ActivityLogs.Include(l => l.ActivityUser)
                    .Include(l => l.AssociatedProject)
                    .Where(l => l.ProjectId == projectId)
                    .OrderByDescending(l => l.ActivityTime)
                    .Select(l => new ActivityLogDTO
                    {
                        ActivityLogId = l.ActivityLogId,
                        ActivityAction = l.ActivityAction,
                        ActivityTime = l.ActivityTime,
                        UserName = l.ActivityUser != null ? l.ActivityUser.UserName : null,
                        ProjectTitle =
                            l.AssociatedProject != null ? l.AssociatedProject.ProjectTitle : null,
                        TaskTitle = l.ActivityAction.ToLower().Contains("task")
                            ? l.TaskTitle
                            : null,
                        TaskStatus = l.TaskStatus,
                        CommentContent = l.ActivityAction.ToLower().Contains("comment")
                            ? l.CommentContent
                            : null,
                        ProjectStatus = l.ProjectStatus,
                    })
                    .ToListAsync();

                return Ok(logs);
            }
            catch (Exception)
            {
                return StatusCode(
                    500,
                    new { message = "An error occurred while retrieving project activity logs." }
                );
            }
        }

        [HttpGet("get-by-date-range")]
        public async Task<ActionResult<IEnumerable<ActivityLogDTO>>> GetLogsByDateRange(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate
        )
        {
            try
            {
                var logs = await _context
                    .ActivityLogs.Include(l => l.ActivityUser)
                    .Include(l => l.AssociatedProject)
                    .Where(l => l.ActivityTime >= startDate && l.ActivityTime <= endDate)
                    .OrderByDescending(l => l.ActivityTime)
                    .Select(l => new ActivityLogDTO
                    {
                        ActivityLogId = l.ActivityLogId,
                        ActivityAction = l.ActivityAction,
                        ActivityTime = l.ActivityTime,
                        UserName = l.ActivityUser != null ? l.ActivityUser.UserName : null,
                        ProjectTitle =
                            l.AssociatedProject != null ? l.AssociatedProject.ProjectTitle : null,
                        TaskTitle = l.ActivityAction.ToLower().Contains("task")
                            ? l.TaskTitle
                            : null,
                        TaskStatus = l.TaskStatus,
                        CommentContent = l.ActivityAction.ToLower().Contains("comment")
                            ? l.CommentContent
                            : null,
                        ProjectStatus = l.ProjectStatus,
                    })
                    .ToListAsync();

                return Ok(logs);
            }
            catch (Exception)
            {
                return StatusCode(
                    500,
                    new
                    {
                        message = "An error occurred while retrieving activity logs by date range.",
                    }
                );
            }
        }

        [HttpGet("get-by-user/{userId}")]
        public async Task<ActionResult<IEnumerable<ActivityLogDTO>>> GetLogsByUser(int userId)
        {
            try
            {
                var logs = await _context
                    .ActivityLogs.Include(l => l.ActivityUser)
                    .Include(l => l.AssociatedProject)
                    .Where(l => l.UserId == userId)
                    .OrderByDescending(l => l.ActivityTime)
                    .Select(l => new ActivityLogDTO
                    {
                        ActivityLogId = l.ActivityLogId,
                        ActivityAction = l.ActivityAction,
                        ActivityTime = l.ActivityTime,
                        UserName = l.ActivityUser != null ? l.ActivityUser.UserName : null,
                        ProjectTitle =
                            l.AssociatedProject != null ? l.AssociatedProject.ProjectTitle : null,
                        TaskTitle = l.ActivityAction.ToLower().Contains("task")
                            ? l.TaskTitle
                            : null,
                        TaskStatus = l.TaskStatus,
                        CommentContent = l.ActivityAction.ToLower().Contains("comment")
                            ? l.CommentContent
                            : null,
                        ProjectStatus = l.ProjectStatus,
                    })
                    .ToListAsync();

                return Ok(logs);
            }
            catch (Exception)
            {
                return StatusCode(
                    500,
                    new { message = "An error occurred while retrieving user activity logs." }
                );
            }
        }
    }
}
