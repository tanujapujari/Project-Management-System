namespace ProjectManagementSystem.Models
{
    public class Comment
    {
        public int CommentId { get; set; }
        public string CommentContent { get; set; } = string.Empty;

        // Foreign Keys
        public int? TaskItemId { get; set; }
        public TaskItem? RelatedTaskItem { get; set; }

        public int? ProjectId { get; set; }
        public Project? RelatedProject { get; set; }

        public int CommentedById { get; set; }
        public User? CommentedByAuthor { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
