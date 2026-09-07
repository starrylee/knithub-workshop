package com.knithub.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 织友专属 Web 站点后端入口（技术方案第 4 节阶段 0）。
 *
 * <p>启动前提：JDK 21 + Maven 3.9+。启动命令：{@code mvn spring-boot:run}，
 * 默认端口 8080（见 application.properties）。
 *
 * <p>红线提醒：新增任何端点/功能前，先阅读根目录 AGENTS.md，
 * 确认对应 US 文件已通过方案拦截协议审查（AGENTS.md 红线 1）。
 */
@SpringBootApplication
public class ServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServerApplication.class, args);
    }
}
