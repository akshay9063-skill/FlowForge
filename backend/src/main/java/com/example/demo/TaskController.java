
package com.example.demo;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final AppUserRepository appUserRepository;

    public TaskController(
            TaskRepository taskRepository,
            ProjectRepository projectRepository,
            AppUserRepository appUserRepository) {
        this.taskRepository = taskRepository;
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

    private List<Long> getUserProjectIds(AppUser user) {
        return projectRepository.findByOwner_Id(user.getId())
                .stream()
                .map(Project::getId)
                .collect(Collectors.toList());
    }

    private boolean ownsProject(Long projectId, AppUser user) {
        return projectId != null
                && projectRepository
                        .findByIdAndOwner_Id(projectId, user.getId())
                        .isPresent();
    }

    @GetMapping
    public ResponseEntity<List<Task>> getTasks(
            @RequestParam(required = false) Long projectId,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);

        if (projectId != null) {
            if (!ownsProject(projectId, user)) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(
                    taskRepository.findByProjectId(projectId));
        }

        List<Long> projectIds = getUserProjectIds(user);

        if (projectIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(
                taskRepository.findByProjectIdIn(projectIds));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTask(
            @PathVariable Long id,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);
        List<Long> projectIds = getUserProjectIds(user);

        Optional<Task> result =
                taskRepository.findByIdAndProjectIdIn(id, projectIds);

        if (result.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(result.get());
    }

    @PostMapping
    public ResponseEntity<?> createTask(
            @RequestBody Task task,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);

        if (task.getTitle() == null
                || task.getTitle().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Task title is required.");
        }

        if (!ownsProject(task.getProjectId(), user)) {
            return ResponseEntity.badRequest()
                    .body("Select a project that belongs to your account.");
        }

        if (task.getStatus() == null
                || task.getStatus().isBlank()) {
            task.setStatus("To Do");
        }

        if (task.getPriority() == null
                || task.getPriority().isBlank()) {
            task.setPriority("Medium");
        }

        task.setId(null);

        Task savedTask = taskRepository.save(task);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedTask);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(
            @PathVariable Long id,
            @RequestBody Task updatedTask,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);
        List<Long> projectIds = getUserProjectIds(user);

        Optional<Task> result =
                taskRepository.findByIdAndProjectIdIn(id, projectIds);

        if (result.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (updatedTask.getTitle() == null
                || updatedTask.getTitle().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Task title is required.");
        }

        if (!ownsProject(updatedTask.getProjectId(), user)) {
            return ResponseEntity.badRequest()
                    .body("Select a project that belongs to your account.");
        }

        Task existingTask = result.get();

        existingTask.setTitle(updatedTask.getTitle());
        existingTask.setDescription(updatedTask.getDescription());
        existingTask.setStatus(
                updatedTask.getStatus() == null
                        || updatedTask.getStatus().isBlank()
                        ? "To Do"
                        : updatedTask.getStatus());
        existingTask.setPriority(
                updatedTask.getPriority() == null
                        || updatedTask.getPriority().isBlank()
                        ? "Medium"
                        : updatedTask.getPriority());
        existingTask.setDueDate(updatedTask.getDueDate());
        existingTask.setProjectId(updatedTask.getProjectId());

        Task savedTask = taskRepository.save(existingTask);

        return ResponseEntity.ok(savedTask);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);
        List<Long> projectIds = getUserProjectIds(user);

        Optional<Task> result =
                taskRepository.findByIdAndProjectIdIn(id, projectIds);

        if (result.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        taskRepository.delete(result.get());

        return ResponseEntity.noContent().build();
    }
}
