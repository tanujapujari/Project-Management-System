using AutoMapper;
using ProjectManagementSystem.DTOs;
using ProjectManagementSystem.Models;

namespace ProjectManagementSystem.Profiles
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            CreateMap<User, UserDTO>().ReverseMap();
            CreateMap<Comment, CommentDTO>().ReverseMap();
            CreateMap<Project, ProjectDTO>();
            CreateMap<CreateProjectDTO, Project>();
            CreateMap<UpdateProjectDTO, Project>();
            CreateMap<TaskItem, TaskItemDTO>().ReverseMap();
        }
    }
}
