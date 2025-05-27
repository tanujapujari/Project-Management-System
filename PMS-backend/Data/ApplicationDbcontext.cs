using System.Runtime.CompilerServices;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem.Models;

namespace ProjectManagementSystem.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<TaskItem> TaskItems { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Project configurations
            modelBuilder.Entity<Project>().HasKey(p => p.ProjectId);
            modelBuilder.Entity<Project>().Property(p => p.ProjectTitle).IsRequired();
            modelBuilder.Entity<Project>().Property(p => p.ProjectStatus).IsRequired();
            modelBuilder.Entity<Project>().Property(p => p.ProjectStartDate).IsRequired();
            modelBuilder.Entity<Project>().Property(p => p.ProjectDeadLine).IsRequired();
            modelBuilder.Entity<Project>().Property(p => p.ProjectDescription).IsRequired();

            // Task configurations
            modelBuilder.Entity<TaskItem>().HasKey(t => t.TaskItemId);
            modelBuilder.Entity<TaskItem>().Property(t => t.TaskTitle).IsRequired();
            modelBuilder.Entity<TaskItem>().Property(t => t.TaskStatus).IsRequired();
            modelBuilder.Entity<TaskItem>().Property(t => t.TaskPriority).IsRequired();
            modelBuilder.Entity<TaskItem>().Property(t => t.TaskDescription).IsRequired();
            modelBuilder.Entity<TaskItem>().Property(t => t.CreatedAt).IsRequired();

            // Comment configurations
            modelBuilder.Entity<Comment>().HasKey(c => c.CommentId);
            modelBuilder.Entity<Comment>().Property(c => c.CommentContent).IsRequired();
            modelBuilder.Entity<Comment>().Property(c => c.CreatedAt).IsRequired();

            // ActivityLog configurations
            modelBuilder.Entity<ActivityLog>().HasKey(a => a.ActivityLogId);
            modelBuilder.Entity<ActivityLog>().Property(a => a.ActivityAction).IsRequired();
            modelBuilder.Entity<ActivityLog>().Property(a => a.ActivityTime).IsRequired();

            // Relationships
            modelBuilder
                .Entity<Project>()
                .HasOne(p => p.CreatedByUser)
                .WithMany(u => u.CreatedProjects)
                .HasForeignKey("CreatedByUserId")
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<TaskItem>()
                .HasOne(t => t.RelatedProject)
                .WithMany(p => p.ProjectTasks)
                .HasForeignKey("ProjectId")
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<TaskItem>()
                .HasOne(t => t.AssignedUser)
                .WithMany(u => u.AssignedTasks)
                .HasForeignKey("AssignedUserId")
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder
                .Entity<Comment>()
                .HasOne(c => c.RelatedTaskItem)
                .WithMany(t => t.Comments)
                .HasForeignKey("TaskItemId")
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<Comment>()
                .HasOne(c => c.CommentedByAuthor)
                .WithMany(u => u.UserComments)
                .HasForeignKey("CommentedById")
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<ActivityLog>()
                .HasOne(a => a.ActivityUser)
                .WithMany(u => u.UserActivityLogs)
                .HasForeignKey("UserId")
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<ActivityLog>()
                .HasOne(a => a.AssociatedProject)
                .WithMany(p => p.ProjectActivityLogs)
                .HasForeignKey("ProjectId")
                .OnDelete(DeleteBehavior.Cascade);

            // User-Project many-to-many
            modelBuilder
                .Entity<Project>()
                .HasMany(p => p.Users)
                .WithMany(u => u.AssignedProjects)
                .UsingEntity(j => j.ToTable("UserProject"));

            // PasswordResetTokens
            modelBuilder
                .Entity<PasswordResetToken>()
                .HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId);

            // IDENTITY STARTING POINT FOR ALL TABLES
            modelBuilder
                .Entity<Project>()
                .Property(p => p.ProjectId)
                .ValueGeneratedOnAdd()
                .HasAnnotation("SqlServer:Identity", "101, 1");

            modelBuilder
                .Entity<TaskItem>()
                .Property(t => t.TaskItemId)
                .ValueGeneratedOnAdd()
                .HasAnnotation("SqlServer:Identity", "101, 1");

            modelBuilder
                .Entity<Comment>()
                .Property(c => c.CommentId)
                .ValueGeneratedOnAdd()
                .HasAnnotation("SqlServer:Identity", "101, 1");

            modelBuilder
                .Entity<ActivityLog>()
                .Property(a => a.ActivityLogId)
                .ValueGeneratedOnAdd()
                .HasAnnotation("SqlServer:Identity", "101, 1");

            modelBuilder
                .Entity<PasswordResetToken>()
                .Property(t => t.TokenId)
                .ValueGeneratedOnAdd()
                .HasAnnotation("SqlServer:Identity", "101, 1");

            modelBuilder
                .Entity<RefreshToken>()
                .Property(r => r.RefreshTokenId)
                .ValueGeneratedOnAdd()
                .HasAnnotation("SqlServer:Identity", "101, 1");
        }

        public void ResetIdentitySeeds()
        {
            // Call the async version synchronously
            ResetIdentitySeedsAsync().GetAwaiter().GetResult();
        }

        public async Task ResetIdentitySeedsAsync()
        {
            var tableConfigs = new Dictionary<string, string>
            {
                { "Projects", "ProjectId" },
                { "TaskItems", "TaskItemId" },
                { "Comments", "CommentId" },
                { "ActivityLogs", "ActivityLogId" },
                { "PasswordResetTokens", "TokenId" },
                { "RefreshTokens", "RefreshTokenId" },
            };

            foreach (var config in tableConfigs)
            {
                string tableName = config.Key;
                string idColumn = config.Value;

                try
                {
                    // First check if the table exists
                    var tableExistsQuery =
                        $@"
                        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '{tableName}')
                        SELECT 1 ELSE SELECT 0";

                    var tableExists = await Database
                        .SqlQueryRaw<int>(tableExistsQuery)
                        .FirstOrDefaultAsync();

                    if (tableExists == 1)
                    {
                        // Get the current max ID for the table
                        var maxIdQuery = $"SELECT ISNULL(MAX({idColumn}), 0) FROM {tableName}";
                        var maxId = await Database
                            .SqlQueryRaw<int>(maxIdQuery)
                            .FirstOrDefaultAsync();

                        // Set the seed to max + 1 or 101 (whichever is greater)
                        var newSeed = Math.Max(maxId, 100);

                        // Reset the identity seed
                        await Database.ExecuteSqlAsync(
                            $"DBCC CHECKIDENT ('{tableName}', RESEED, {newSeed})"
                        );

                        Console.WriteLine($"Reset identity seed for {tableName} to {newSeed}");
                    }
                }
                catch (Exception ex)
                {
                    // Log the error but continue with other tables
                    Console.WriteLine(
                        $"Error resetting identity seed for {tableName}: {ex.Message}"
                    );
                }
            }
        }

        private bool IsValidTableName(string tableName)
        {
            var validTables = new HashSet<string>
            {
                "Projects",
                "TaskItems",
                "Comments",
                "ActivityLogs",
                "PasswordResetTokens",
                "RefreshTokens",
            };
            return validTables.Contains(tableName);
        }
    }
}
