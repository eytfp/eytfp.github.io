# 5-各种spring

[TOC]

## 1Spring（Spring Framework）

Spring 是**Java 平台上开源、轻量级的企业级应用框架，本质是一个 IoC（控制反转）容器**，作者 Rod Johnson，2003 年发布，用来替代当年笨重的 EJB，让 Java 开发更简单、解耦、易测试。

![image-20261124093903182](https://cdn.jsdelivr.net/gh/eytfp/Bed/img/image-20261124093903182.png)

Spring 是 Java 轻量级开源框架，核心是 IoC 容器和 AOP，用来管理对象、解耦组件、统一处理横切逻辑，简化企业级 Java 开发；现在工程上几乎都是用 Spring Boot 来使用 Spring 能力。

## 2SpringMVC

SpringMVC 是 **Spring Framework 里面的 Web 模块**，也可以说SpringMVC 是 Spring 家族里负责 Web 层的模块；是一套基于 Servlet、遵循 MVC 设计模式的 Web 开发框架，用来开发 Java Web 接口 / 网页。

MVC 是一种代码分层思想：

- **M Model（模型）**：数据模型、业务实体、业务逻辑、数据库数据（POJO、Service、DAO）
- **V View（视图）**：展示页面（JSP、Thymeleaf；现在前后端分离项目基本不用视图，直接返回 JSON）
- **C Controller（控制器）**：接收前端请求、调用业务、返回结果，是中间调度者

SpringMVC 就是把这套 MVC 思想落地，并且和 Spring IoC 容器无缝结合。

![image-20261124083540176](https://cdn.jsdelivr.net/gh/eytfp/Bed/img/image-20261124083540176.png)

```
1. 请求入口
请求先到 Servlet 容器，由 DispatcherServlet 统一接收（传统项目在 web.xml 配置，Spring Boot 由自动配置注册并默认映射 /）。它是整个 MVC 的调度中心。
2. 找处理器
DispatcherServlet 调用 HandlerMapping，根据 URL、HTTP 方法、请求参数等条件，找到匹配的 Handler（通常是某个 Controller 方法），同时拿到配套的拦截器链，组成 HandlerExecutionChain。
3. 适配并调用
不同形式的 Handler 调用方式不同，HandlerAdapter 负责统一适配。这里会完成：

参数解析与绑定（@RequestParam、@PathVariable、@RequestBody 等）
类型转换、数据校验
HttpMessageConverter 对 JSON/XML 等请求体的反序列化

4. 执行业务
Controller 方法执行业务逻辑，返回结果。返回值可能是 ModelAndView、视图名、对象、字符串，或 void。
5. 结果处理（两条分支）

传统视图分支：返回 ModelAndView → ViewResolver 把逻辑视图名解析成具体 View（如 JSP、Thymeleaf）→ 渲染 Model → 写回响应。图中走的是这条。
REST 分支：方法带 @ResponseBody 或类是 @RestController → 由 HttpMessageConverter 直接把对象序列化成 JSON/XML 写回，跳过 ViewResolver。

6. 异常与收尾
过程中抛出的异常交给 HandlerExceptionResolver（如 @ControllerAdvice）处理；拦截器在请求前后执行 preHandle / postHandle / afterCompletion。
```

## 3springboot

SpringMVC 是 Spring 家族里负责 Web 层的模块；**Spring Boot 是上层脚手架**。

Boot 通过自动配置帮你创建 DispatcherServlet、HandlerMapping、HandlerAdapter 等组件，并把它们注册进内嵌容器，所以你只需要写 @RestController 和业务方法。 MVC 请求链路在 Boot 项目里完全一样，只是组件不用手动配了。

![image-20261124085005860](https://cdn.jsdelivr.net/gh/eytfp/Bed/img/image-20261124085005860.png)

```
一个最小 Boot 应用就是：


@SpringBootApplication
public class App {
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}

@RestController
class HelloController {
    @GetMapping("/hello")
    public String hello() { return "hi"; }
}
```



## 4springCloud和微服务

“微服务”是一种**架构风格**——把一个大应用按业务域拆成多个能独立开发、部署、扩容的小服务。

![image-20261124090542199](https://cdn.jsdelivr.net/gh/eytfp/Bed/img/image-20261124090542199.png)

服务怎么互相找到、统一配置怎么管、外部流量怎么进、某个服务挂了会不会雪崩、调用链怎么排查。**Spring Cloud 就是回答这些问题的一套框架集合：**

![image-20261124090636236](https://cdn.jsdelivr.net/gh/eytfp/Bed/img/image-20261124090636236.png)

**Spring Cloud 不是单个框架，而是一组基于 Spring Boot 的框架集合**，专门用来解决微服务架构里的共性治理问题：服务注册与发现、服务间调用、API 网关、统一配置、熔断限流、链路追踪等。

两者不是绑定关系：微服务可以用 Dubbo、gRPC + Kubernetes/Istio 等方式落地；Spring Cloud 只是 Java/Spring 生态里最主流的一种落地方案。





### **总结一下**

| 层次             | 定位                                                         |
| :--------------- | :----------------------------------------------------------- |
| Spring Framework | 核心容器：IOC、AOP、SpringMVC、事务、数据访问                |
| Spring Boot      | **单个服务**的开发脚手架：自动配置、起步依赖、内嵌容器       |
| Spring Cloud     | **多个服务之间**的治理框架：把一堆 Boot 应用组织成一个微服务系统 |

![image-20261124091838905](https://cdn.jsdelivr.net/gh/eytfp/Bed/img/image-20261124091838905.png)

### **四者的联系**

- **Spring Framework（2004）**：地基。提供 IOC 容器、AOP、事务、数据访问等核心能力。
- **SpringMVC**：**不是独立项目**，是 Spring Framework 内部的 Web 模块（基于 MVC 模式处理 HTTP 请求）。我们前面讲的那条 `DispatcherServlet → HandlerMapping → Controller → View` 链路，就是它的一部分。
- **Spring Boot（2014）**：构建在 Spring Framework 之上。它没有发明新的 Web 框架，而是用**自动配置 + 起步依赖 + 内嵌容器**把单个 Spring 应用的搭建成本降下来。Boot 项目里的 Web 层默认仍然是 SpringMVC（或响应式 WebFlux）。
- **Spring Cloud（2015）**：构建在 Spring Boot 之上。它管的是**多个 Boot 服务之间**的协作治理（注册发现、网关、配置、熔断、追踪）。Cloud 里的每个微服务本身就是一个 Boot 应用。

![image-20261124091635856](https://cdn.jsdelivr.net/gh/eytfp/Bed/img/image-20261124091635856.png)

## 5spring家族其它成员

![image-20261124092557043](https://cdn.jsdelivr.net/gh/eytfp/Bed/img/image-20261124092557043.png)

| 类别     | 代表项目                                                     | 作用                                 |
| :------- | :----------------------------------------------------------- | :----------------------------------- |
| 数据访问 | Spring Data JPA / Redis / MongoDB / Elasticsearch、Spring JDBC、Spring Batch | 统一的数据访问抽象，Batch 做批处理   |
| 安全     | Spring Security、OAuth2 Authorization Server、Spring Session | 认证授权、OAuth2、分布式 Session     |
| Web 扩展 | Spring WebFlux、Spring WebSocket、Spring HATEOAS             | 响应式 Web、WebSocket、REST 超媒体   |
| 消息集成 | Spring Integration、Spring AMQP、Spring Kafka、Spring Cloud Stream | 消息驱动、事件集成                   |
| 运维监控 | Spring Boot Actuator、Spring Shell                           | 健康检查/指标、命令行工具            |
| 测试     | Spring Test、Spring Boot Test、MockMvc                       | 单元测试与 Web 层模拟测试            |
| 云原生   | Spring Native/AOT、Spring Cloud Kubernetes                   | GraalVM 原生镜像、K8s 集成           |
| 其他     | Spring Statemachine、Spring Roo（较老）、Spring WS           | 状态机、快速脚手架、SOAP Web Service |