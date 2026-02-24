using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem.Models
{
    public class Project
    {
        [Key]
        public int ProjectId { get; set; }

        public string ProjectTitle { get; set; } = string.Empty;
        public string ProjectDescription { get; set; } = string.Empty;
        public DateTime ProjectStartDate { get; set; } = DateTime.UtcNow;
        public DateTime ProjectDeadLine { get; set; }
        public string ProjectStatus { get; set; } = string.Empty;
        public int CreatedByUserId { get; set; }

        [ForeignKey("CreatedByUserId")]
        public User CreatedByUser { get; set; } = null!;
        public ICollection<TaskItem> ProjectTasks { get; set; } = new List<TaskItem>();
        public ICollection<User> Users { get; set; } = new List<User>();
        public ICollection<ActivityLog> ProjectActivityLogs { get; set; } = new List<ActivityLog>();
    }
}
