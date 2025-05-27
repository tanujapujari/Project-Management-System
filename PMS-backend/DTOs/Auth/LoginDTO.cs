namespace ProjectManagementSystem.DTOs.Auth
{
    public class LoginDTO
    {
        public string UserEmail { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string UserRole { get; set; } = string.Empty;
    }
}
