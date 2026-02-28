namespace ProjectManagementSystem.DTOs
{
    public class UpdateProjectDTO
    {
        public string ProjectTitle { get; set; } = string.Empty;
        public string ProjectDescription { get; set; } = string.Empty;
        public DateTime ProjectStartDate { get; set; }
        public DateTime ProjectDeadLine { get; set; }
        public string ProjectStatus { get; set; } = string.Empty;
        public int CreatedByUserId { get; set; }
        public List<int> AssignedUserIds { get; set; } = new();
    }
}
