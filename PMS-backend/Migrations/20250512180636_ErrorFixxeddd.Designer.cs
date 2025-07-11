﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using ProjectManagementSystem.Data;

#nullable disable

namespace ProjectManagementSystem.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20250512180636_ErrorFixxeddd")]
    partial class ErrorFixxeddd
    {
        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "9.0.3")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder);

            modelBuilder.Entity("ProjectManagementSystem.Models.ActivityLog", b =>
                {
                    b.Property<int>("ActivityLogId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasAnnotation("SqlServer:Identity", "101, 1");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("ActivityLogId"));

                    b.Property<string>("ActivityAction")
                        .IsRequired()
                        .HasMaxLength(50)
                        .HasColumnType("nvarchar(50)");

                    b.Property<DateTime>("ActivityTime")
                        .HasColumnType("datetime2");

                    b.Property<int>("ProjectId")
                        .HasColumnType("int");

                    b.Property<int?>("TaskAssignedToId")
                        .HasColumnType("int");

                    b.Property<int?>("TaskAssignedToUserUserId")
                        .HasColumnType("int");

                    b.Property<string>("TaskStatus")
                        .HasMaxLength(50)
                        .HasColumnType("nvarchar(50)");

                    b.Property<string>("TaskTitle")
                        .HasMaxLength(200)
                        .HasColumnType("nvarchar(200)");

                    b.Property<int>("UserId")
                        .HasColumnType("int");

                    b.HasKey("ActivityLogId");

                    b.HasIndex("ProjectId");

                    b.HasIndex("TaskAssignedToUserUserId");

                    b.HasIndex("UserId");

                    b.ToTable("ActivityLogs");
                });

            modelBuilder.Entity("ProjectManagementSystem.Models.Comment", b =>
                {
                    b.Property<int>("CommentId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasAnnotation("SqlServer:Identity", "101, 1");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("CommentId"));

                    b.Property<string>("CommentContent")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<int>("CommentedById")
                        .HasColumnType("int");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("datetime2");

                    b.Property<int>("TaskItemId")
                        .HasColumnType("int");

                    b.HasKey("CommentId");

                    b.HasIndex("CommentedById");

                    b.HasIndex("TaskItemId");

                    b.ToTable("Comments");
                });

            modelBuilder.Entity("ProjectManagementSystem.Models.PasswordResetToken", b =>
                {
                    b.Property<int>("TokenId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasAnnotation("SqlServer:Identity", "101, 1");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("TokenId"));

                    b.Property<DateTime>("ExpiryTime")
                        .HasColumnType("datetime2");

                    b.Property<string>("TokenHash")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("UserEmail")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<int>("UserId")
                        .HasColumnType("int");

                    b.HasKey("TokenId");

                    b.HasIndex("UserId");

                    b.ToTable("PasswordResetTokens");
                });

            modelBuilder.Entity("ProjectManagementSystem.Models.Project", b =>
                {
                    b.Property<int>("ProjectId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasAnnotation("SqlServer:Identity", "101, 1");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("ProjectId"));

                    b.Property<int>("CreatedByUserId")
                        .HasColumnType("int");

                    b.Property<DateTime>("ProjectDeadLine")
                        .HasColumnType("datetime2");

                    b.Property<string>("ProjectDescription")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<DateTime>("ProjectStartDate")
                        .HasColumnType("datetime2");

                    b.Property<string>("ProjectStatus")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("ProjectTitle")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.HasKey("ProjectId");

                    b.HasIndex("CreatedByUserId");

                    b.ToTable("Projects");
                });

            modelBuilder.Entity("ProjectManagementSystem.Models.TaskItem", b =>
                {
                    b.Property<int>("TaskItemId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasAnnotation("SqlServer:Identity", "101, 1");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("TaskItemId"));

                    b.Property<int?>("AssignedUserId")
                        .HasColumnType("int");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("datetime2");

                    b.Property<int>("ProjectId")
                        .HasColumnType("int");

                    b.Property<string>("TaskDescription")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("TaskPriority")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("TaskStatus")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("TaskTitle")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.HasKey("TaskItemId");

                    b.HasIndex("AssignedUserId");

                    b.HasIndex("ProjectId");

                    b.ToTable("TaskItems");
                });

            modelBuilder.Entity("ProjectManagementSystem.Models.User", b =>
                {
                    b.Property<int>("UserId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("UserId"));

                    b.Property<string>("UserEmail")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("UserName")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<byte[]>("UserPasswordHash")
                        .HasColumnType("varbinary(max)");

                    b.Property<byte[]>("UserPasswordSalt")
                        .HasColumnType("varbinary(max)");

                    b.Property<string>("UserRole")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.HasKey("UserId");

                    b.ToTable("Users");
                });

            modelBuilder.Entity("ProjectUser", b =>
                {
                    b.Property<int>("AssignedProjectsProjectId")
                        .HasColumnType("int");

                    b.Property<int>("UsersUserId")
                        .HasColumnType("int");

                    b.HasKey("AssignedProjectsProjectId", "UsersUserId");

                    b.HasIndex("UsersUserId");

                    b.ToTable("UserProject", (string)null);
                });

            modelBuilder.Entity("RefreshToken", b =>
                {
                    b.Property<int>("RefreshTokenId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasAnnotation("SqlServer:Identity", "101, 1");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("RefreshTokenId"));

                    b.Property<DateTime>("ExpiryTime")
                        .HasColumnType("datetime2");

                    b.Property<bool>("IsRevoked")
                        .HasColumnType("bit");

                    b.Property<bool>("IsUsed")
                        .HasColumnType("bit");

                    b.Property<string>("TokenHash")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("TokenSalt")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("UserEmail")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<int>("UserId")
                        .HasColumnType("int");

                    b.HasKey("RefreshTokenId");

                    b.HasIndex("UserId");

                    b.ToTable("RefreshTokens");
                });

            modelBuilder.Entity("ProjectManagementSystem.Models.ActivityLog", b =>
                {
                    b.HasOne("ProjectManagementSystem.Models.Project", "AssociatedProject")
                        .WithMany("ProjectActivityLogs")
                        .HasForeignKey("ProjectId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("ProjectManagementSystem.Models.User", "TaskAssignedToUser")
                        .WithMany()
                        .HasForeignKey("TaskAssignedToUserUserId");

                    b.HasOne("ProjectManagementSystem.Models.User", "ActivityUser")
                        .WithMany("UserActivityLogs")
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("ActivityUser");

                    b.Navigation("AssociatedProject");

                    b.Navigation("TaskAssignedToUser");
                });

            modelBuilder.Entity("ProjectManagementSystem.Models.Comment", b =>
                {
                    b.HasOne("ProjectManagementSystem.Models.User", "CommentedByAuthor")
                        .WithMany("UserComments")
                        .HasForeignKey("CommentedById")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("ProjectManagementSystem.Models.TaskItem", "RelatedTaskItem")
                        .WithMany("Comments")
                        .HasForeignKey("TaskItemId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("CommentedByAuthor");

                    b.Navigation("RelatedTaskItem");
                });

            modelBuilder.Entity("ProjectManagementSystem.Models.PasswordResetToken", b =>
                {
                    b.HasOne("ProjectManagementSystem.Models.User", "User")
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("User");
                });

            modelBuilder.Entity("ProjectManagementSystem.Models.Project", b =>
                {
                    b.HasOne("ProjectManagementSystem.Models.User", "CreatedByUser")
                        .WithMany("CreatedProjects")
                        .HasForeignKey("CreatedByUserId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.Navigation("CreatedByUser");
                });

            modelBuilder.Entity("ProjectManagementSystem.Models.TaskItem", b =>
                {
                    b.HasOne("ProjectManagementSystem.Models.User", "AssignedUser")
                        .WithMany("AssignedTasks")
                        .HasForeignKey("AssignedUserId")
                        .OnDelete(DeleteBehavior.SetNull);

                    b.HasOne("ProjectManagementSystem.Models.Project", "RelatedProject")
                        .WithMany("ProjectTasks")
                        .HasForeignKey("ProjectId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("AssignedUser");

                    b.Navigation("RelatedProject");
                });

            modelBuilder.Entity("ProjectUser", b =>
                {
                    b.HasOne("ProjectManagementSystem.Models.Project", null)
                        .WithMany()
                        .HasForeignKey("AssignedProjectsProjectId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("ProjectManagementSystem.Models.User", null)
                        .WithMany()
                        .HasForeignKey("UsersUserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("RefreshToken", b =>
                {
                    b.HasOne("ProjectManagementSystem.Models.User", "User")
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("User");
                });

            modelBuilder.Entity("ProjectManagementSystem.Models.Project", b =>
                {
                    b.Navigation("ProjectActivityLogs");

                    b.Navigation("ProjectTasks");
                });

            modelBuilder.Entity("ProjectManagementSystem.Models.TaskItem", b =>
                {
                    b.Navigation("Comments");
                });

            modelBuilder.Entity("ProjectManagementSystem.Models.User", b =>
                {
                    b.Navigation("AssignedTasks");

                    b.Navigation("CreatedProjects");

                    b.Navigation("UserActivityLogs");

                    b.Navigation("UserComments");
                });
#pragma warning restore 612, 618
        }
    }
}
