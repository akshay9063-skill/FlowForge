
package com.example.demo;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final AppUserRepository appUserRepository;

    public ProjectController(
            ProjectRepository projectRepository,
            AppUserRepository appUserRepository) {
        this.projectRepository = projectRepository;
        this.appUserRepository = appUserRepository;
    }

    private AppUser getCurrentUser(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required.");
        }

        return appUserRepository
                .findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() ->
                        new AccessDeniedException("User not found."));
    }

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects(
            Authentication authentication) {
        AppUser user = getCurrentUser(authentication);
        return ResponseEntity.ok(
                projectRepository.findByOwner_Id(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(
            @PathVariable Long id,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);
        Optional<Project> project =
                projectRepository.findByIdAndOwner_Id(id, user.getId());

        if (project.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(project.get());
    }

    @PostMapping
    public ResponseEntity<Project> createProject(
            @RequestBody Project project,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);

        project.setId(null);
        project.setOwner(user);

        Project savedProject = projectRepository.save(project);
        return ResponseEntity.ok(savedProject);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(
            @PathVariable Long id,
            @RequestBody Project updatedProject,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);
        Optional<Project> result =
                projectRepository.findByIdAndOwner_Id(id, user.getId());

        if (result.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Project existingProject = result.get();
        existingProject.setName(updatedProject.getName());
        existingProject.setDescription(updatedProject.getDescription());
        existingProject.setStatus(updatedProject.getStatus());

        Project savedProject = projectRepository.save(existingProject);
        return ResponseEntity.ok(savedProject);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable Long id,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);
        Optional<Project> result =
                projectRepository.findByIdAndOwner_Id(id, user.getId());

        if (result.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        projectRepository.delete(result.get());

        return ResponseEntity.noContent().build();
    }
}
