package com.knithub.server.project;

import java.util.Map;

/**
 * 创建项目时的字段级校验失败（FT-02-US-01 AC-3/AC-4/AC-6）。
 *
 * <p>携带 {@code field -> message} 映射，由 Controller 转 400 + {@code {"errors": {...}}}。
 */
public class ProjectValidationException extends RuntimeException {

    private final Map<String, String> errors;

    public ProjectValidationException(Map<String, String> errors) {
        this.errors = errors;
    }

    public Map<String, String> getErrors() {
        return errors;
    }
}
