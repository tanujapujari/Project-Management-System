namespace ProjectManagementSystem.Settings
{
    public class EmailSettings
    {
        public string SmtpServer { get; set; } = string.Empty;
        public int Port { get; set; }
        public string SenderEmail { get; set; } = string.Empty;
        public string SenderName { get; set; } = "Admin";
        public string Password { get; set; } = string.Empty;
    }
}
