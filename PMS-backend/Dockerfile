# Use the official .NET 8 SDK image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["PMS-backend/ProjectManagementSystem.csproj", "PMS-backend/"]
RUN dotnet restore "PMS-backend/ProjectManagementSystem.csproj"
COPY PMS-backend/. PMS-backend/
WORKDIR /src/PMS-backend
RUN dotnet publish "ProjectManagementSystem.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ProjectManagementSystem.dll"]
