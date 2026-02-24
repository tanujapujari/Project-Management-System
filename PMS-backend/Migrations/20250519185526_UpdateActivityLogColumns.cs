using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagementSystem.Migrations
{
    /// <inheritdoc />
    public partial class UpdateActivityLogColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActivityLogs_Users_TaskAssignedToUserUserId",
                table: "ActivityLogs");

            migrationBuilder.DropIndex(
                name: "IX_ActivityLogs_TaskAssignedToUserUserId",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "TaskAssignedToId",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "TaskAssignedToUserUserId",
                table: "ActivityLogs");

            migrationBuilder.AddColumn<string>(
                name: "CommentContent",
                table: "ActivityLogs",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProjectStatus",
                table: "ActivityLogs",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CommentContent",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "ProjectStatus",
                table: "ActivityLogs");

            migrationBuilder.AddColumn<int>(
                name: "TaskAssignedToId",
                table: "ActivityLogs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TaskAssignedToUserUserId",
                table: "ActivityLogs",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogs_TaskAssignedToUserUserId",
                table: "ActivityLogs",
                column: "TaskAssignedToUserUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ActivityLogs_Users_TaskAssignedToUserUserId",
                table: "ActivityLogs",
                column: "TaskAssignedToUserUserId",
                principalTable: "Users",
                principalColumn: "UserId");
        }
    }
}
