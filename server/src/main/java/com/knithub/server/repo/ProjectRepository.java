package com.knithub.server.repo;

import com.knithub.server.domain.Project;

import java.util.List;

/**
 * 项目存储接口——Repository 抽象层（FT-02-US-01 引入）。
 *
 * <p>JSON 阶段由 {@code repo/json/JsonProjectRepository} 实现；PG 迁移时仅替换
 * 实现，业务代码只依赖本接口。
 */
public interface ProjectRepository {

    /**
     * 持久化一个项目（分配主键），返回携带 id 的实体。
     */
    Project save(Project project);

    /**
     * 全量读取。
     */
    List<Project> findAll();
}
