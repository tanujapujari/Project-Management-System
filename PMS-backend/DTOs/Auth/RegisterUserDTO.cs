namespace ProjectManagementSystem.DTOs.Auth
{
    public class RegisterUserDTO
    {
        public string UserName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string UserRole { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
    }
}
