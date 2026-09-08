package com.knithub.server.project.dto;

import com.knithub.server.domain.Milestone;

/**
 * 里程碑响应体（FT-02-US-01）：camelCase，含 name / dueDate / completed。
 */
public class MilestoneResponse {

    private String name;
    private String dueDate;
    private Boolean completed;

    public static MilestoneResponse from(Milestone m) {
        MilestoneResponse r = new MilestoneResponse();
        r.setName(m.getName());
        r.setDueDate(m.getDueDate());
        r.setCompleted(m.getCompleted());
        return r;
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

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }
}
