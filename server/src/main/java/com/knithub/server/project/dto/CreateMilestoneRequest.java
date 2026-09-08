package com.knithub.server.project.dto;

/**
 * 创建项目时携带的单个里程碑输入（名称必填、预计日期可选，FT-02-US-01）。
 */
public class CreateMilestoneRequest {

    private String name;
    private String dueDate;

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
}
