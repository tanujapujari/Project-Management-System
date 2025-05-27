namespace ProjectManagementSystem.DTOs
{
    public class ActivityLogDTO
    {
        public int ActivityLogId { get; set; }
        public string ActivityAction { get; set; } = string.Empty;
        public DateTime ActivityTime { get; set; }
        public string? UserName { get; set; }
        public string? ProjectTitle { get; set; }
        public string? ProjectStatus { get; set; }

        public string? TaskTitle { get; set; }
        public string? TaskStatus { get; set; }
        public string? CommentContent { get; set; }
        public string ActivityTimeFormatted => ActivityTime.ToString("dd-MM-yyyy");
    }
}
