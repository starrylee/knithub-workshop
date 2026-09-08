package com.knithub.server.project;

import com.knithub.server.domain.Milestone;
import com.knithub.server.domain.Project;
import com.knithub.server.project.dto.CreateMilestoneRequest;
import com.knithub.server.project.dto.CreateProjectRequest;
import com.knithub.server.repo.ProjectRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 项目域业务层（FT-02-US-01 落地）：建档。
 *
 * <p>本期仅实现"创建项目"。状态初始为「待开始」；last_active_at 建档时 =
 * 创建时间（FT-03 打卡接入后更新）。校验逻辑随对应 AC 在后续 TDD 循环中补充。
 */
@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    /**
     * 为指定用户创建一个项目（含可选里程碑）。
     *
     * <p>校验（必填项、名称长度、里程碑名必填）由后续 AC 的 TDD 循环接入；
     * 当前仅做建档落库。
     */
    public Project create(Long userId, CreateProjectRequest req) {
        Map<String, String> errors = new HashMap<>();
        if (req.getName() == null || req.getName().isBlank()) {
            errors.put("name", "请填写项目名称");
        } else if (req.getName().length() > 100) {
            errors.put("name", "名称不超过100字");
        }
        if (req.getDueDate() == null || req.getDueDate().isBlank()) {
            errors.put("dueDate", "请选择预计完成日期");
        }
        if (req.getMilestones() != null) {
            boolean milestoneNameBlank = req.getMilestones().stream()
                    .anyMatch(m -> m.getName() == null || m.getName().isBlank());
            if (milestoneNameBlank) {
                errors.put("milestones", "里程碑名称必填");
            }
        }
        if (!errors.isEmpty()) {
            throw new ProjectValidationException(errors);
        }

        Project project = new Project();
        project.setUserId(userId);
        project.setName(req.getName());
        project.setDueDate(req.getDueDate());
        project.setStatus("待开始");
        project.setIsPublic(false);
        project.setMilestones(toMilestones(req.getMilestones()));
        String now = Instant.now().toString();
        project.setCreatedAt(now);
        project.setLastActiveAt(now);
        return projectRepository.save(project);
    }

    private List<Milestone> toMilestones(List<CreateMilestoneRequest> inputs) {
        List<Milestone> result = new ArrayList<>();
        if (inputs == null) {
            return result;
        }
        for (CreateMilestoneRequest m : inputs) {
            Milestone milestone = new Milestone();
            milestone.setName(m.getName());
            milestone.setDueDate(m.getDueDate());
            milestone.setCompleted(false);
            result.add(milestone);
        }
        return result;
    }
}
