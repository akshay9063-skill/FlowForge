
package com.example.demo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProjectId(Long projectId);

    List<Task> findByProjectIdIn(List<Long> projectIds);

    Optional<Task> findByIdAndProjectIdIn(
            Long id, List<Long> projectIds);
}
