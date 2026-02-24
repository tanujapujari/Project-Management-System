using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem.DTOs
{
    public class ForgotPasswordRequestDTO
    {
        [Required]
        public string UserEmail { get; set; } = string.Empty;
    }
}
