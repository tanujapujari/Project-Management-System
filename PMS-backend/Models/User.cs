using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }

        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;

        public byte[]? UserPasswordHash { get; set; } = Array.Empty<byte>();
        public byte[]? UserPasswordSalt { get; set; } = Array.Empty<byte>();

        public string UserRole { get; set; } = string.Empty;

        public ICollection<Project> CreatedProjects { get; set; } = new List<Project>();
        public ICollection<Project> AssignedProjects { get; set; } = new List<Project>();
        public ICollection<TaskItem> AssignedTasks { get; set; } = new List<TaskItem>();
        public ICollection<Comment> UserComments { get; set; } = new List<Comment>();
        public ICollection<ActivityLog> UserActivityLogs { get; set; } = new List<ActivityLog>();
    }
}
