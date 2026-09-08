package com.knithub.server.project.dto;

import java.util.List;

/**
 * 创建项目请求体（FT-02-US-01）：name 与 dueDate 必填，milestones 可选。
 */
public class CreateProjectRequest {

    private String name;
    private String dueDate;
    private List<CreateMilestoneRequest> milestones;

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

    public List<CreateMilestoneRequest> getMilestones() {
        return milestones;
    }

    public void setMilestones(List<CreateMilestoneRequest> milestones) {
        this.milestones = milestones;
    }
}
