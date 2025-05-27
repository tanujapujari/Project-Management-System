using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ProjectManagementSystem.Models;

public class RefreshToken
{
    [Key]
    public int RefreshTokenId { get; set; }

    [Required]
    public string TokenHash { get; set; } = string.Empty;

    [Required]
    public string TokenSalt { get; set; } = string.Empty;

    [Required]
    public DateTime ExpiryTime { get; set; }

    [Required]
    public int UserId { get; set; }

    public string UserEmail { get; set; } = string.Empty;

    public bool IsRevoked { get; set; } = false;

    public bool IsUsed { get; set; } = false;

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}
