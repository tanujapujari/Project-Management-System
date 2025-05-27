using System;
using System.Collections.Generic;
using ProjectManagementSystem.Models;

namespace ProjectManagementSystem.DTOs
{
    public class TaskItemDTO
    {
        public int TaskItemId { get; set; }
        public string TaskTitle { get; set; } = string.Empty;
        public string TaskDescription { get; set; } = string.Empty;
        public string TaskStatus { get; set; } = string.Empty;
        public string TaskPriority { get; set; } = string.Empty;
        public int ProjectId { get; set; }
        public int? AssignedUserId { get; set; }
        public string? CreatedAt { get; set; }
        public string? CreatedAtFormatted => CreatedAt;

        public ICollection<CommentDTO> Comments { get; set; } = new List<CommentDTO>();
    }
}
