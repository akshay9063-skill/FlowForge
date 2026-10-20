
package com.example.demo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByOwner_Id(Long ownerId);

    Optional<Project> findByIdAndOwner_Id(Long id, Long ownerId);
}
