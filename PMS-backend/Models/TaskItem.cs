using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem.Models
{
    public class TaskItem
    {
        [Key]
        public int TaskItemId { get; set; }

        public string TaskTitle { get; set; } = string.Empty;
        public string TaskDescription { get; set; } = string.Empty;

        public string TaskStatus { get; set; } = "To Do";
        public string TaskPriority { get; set; } = "Normal";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Foreign Keys
        public int ProjectId { get; set; }
        public Project? RelatedProject { get; set; }
        public int? AssignedUserId { get; set; }
        public User? AssignedUser { get; set; }
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    }
}
