using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem.Models
{
    public class ActivityLog
    {
        public int ActivityLogId { get; set; }

        [Required]
        [StringLength(50)]
        public string ActivityAction { get; set; } = string.Empty;

        public DateTime ActivityTime { get; set; }

        // Foreign Keys
        public int UserId { get; set; }
        public User? ActivityUser { get; set; }

        public int ProjectId { get; set; }
        public Project? AssociatedProject { get; set; }

        [StringLength(50)]
        public string? ProjectStatus { get; set; }

        [StringLength(200)]
        public string? TaskTitle { get; set; }

        [StringLength(50)]
        public string? TaskStatus { get; set; }

        [StringLength(500)]
        public string? CommentContent { get; set; }
    }
}
