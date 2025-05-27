using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem.Models
{
    public class PasswordResetToken
    {
        [Key]
        public int TokenId { get; set; }

        [Required]
        public string TokenHash { get; set; } = string.Empty;

        [Required]
        public DateTime ExpiryTime { get; set; } = DateTime.UtcNow.AddHours(1);

        public int UserId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public User? User { get; set; }
    }
}
