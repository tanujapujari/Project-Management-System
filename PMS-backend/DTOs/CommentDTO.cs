namespace ProjectManagementSystem.DTOs
{
    public class CommentDTO
    {
        public int CommentId { get; set; }
        public string CommentContent { get; set; } = string.Empty;
        public int? TaskItemId { get; set; }
        public string? RelatedTaskTitle { get; set; }
        public int? ProjectId { get; set; }
        public string? RelatedProjectTitle { get; set; }
        public int CommentedById { get; set; }
        public string? CommentedByName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
