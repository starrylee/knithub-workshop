package com.knithub.server.repo.json;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.knithub.server.domain.Project;
import com.knithub.server.repo.ProjectRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.List;

/**
 * {@link ProjectRepository} 的 JSON 文件实现（存储：{@code <data-dir>/projects.json}）。
 */
@Component
public class JsonProjectRepository implements ProjectRepository {

    private final JsonFileStore<Project> store;

    public JsonProjectRepository(@Value("${app.data-dir}") String dataDir, ObjectMapper objectMapper) {
        this.store = new JsonFileStore<>(
                Path.of(dataDir, "projects.json"),
                new TypeReference<>() {
                },
                objectMapper);
    }

    @Override
    public Project save(Project project) {
        List<Project> all = store.readAll();
        long nextId = all.stream().mapToLong(Project::getId).max().orElse(0L) + 1;
        project.setId(nextId);
        all.add(project);
        store.writeAll(all);
        return project;
    }

    @Override
    public List<Project> findAll() {
        return store.readAll();
    }
}
