namespace ProjectManagementSystem.DTOs
{
    public class ProjectDTO
    {
        public int ProjectId { get; set; }
        public string ProjectTitle { get; set; } = string.Empty;
        public string ProjectDescription { get; set; } = string.Empty;
        public DateTime ProjectStartDate { get; set; }
        public DateTime ProjectDeadLine { get; set; }
        public string ProjectStatus { get; set; } = string.Empty;
        public int CreatedByUserId { get; set; }
        public string? CreatedByUserName { get; set; }
        public ICollection<TaskItemDTO> ProjectTasks { get; set; } = new List<TaskItemDTO>();
        public List<int> AssignedUserIds { get; set; } = new();
    }
}
