package com.knithub.server.project.dto;

import com.knithub.server.domain.Milestone;
import com.knithub.server.domain.Project;

import java.util.ArrayList;
import java.util.List;

/**
 * 创建项目响应体（FT-02-US-01）：camelCase，含 id / name / dueDate / status /
 * milestones（按序，未完成）。status 初始为「待开始」。
 */
public class ProjectResponse {

    private Long id;
    private String name;
    private String dueDate;
    private String status;
    private List<MilestoneResponse> milestones;

    public static ProjectResponse from(Project p) {
        ProjectResponse r = new ProjectResponse();
        r.setId(p.getId());
        r.setName(p.getName());
        r.setDueDate(p.getDueDate());
        r.setStatus(p.getStatus());
        List<MilestoneResponse> ms = new ArrayList<>();
        if (p.getMilestones() != null) {
            for (Milestone m : p.getMilestones()) {
                ms.add(MilestoneResponse.from(m));
            }
        }
        r.setMilestones(ms);
        return r;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<MilestoneResponse> getMilestones() {
        return milestones;
    }

    public void setMilestones(List<MilestoneResponse> milestones) {
        this.milestones = milestones;
    }
}
