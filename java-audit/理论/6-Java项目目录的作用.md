# Java 项目目录学习笔记

[TOC]

最近在看 Java 后端项目，IDEA 一打开一堆文件夹和包，一开始完全不知道各自是干嘛的。这几天把 Maven、Spring Boot、Spring Cloud 这几种常见工程的目录翻了一遍，把自己弄懂的部分记下来，方便后面回看。有些地方我自己也还没吃透，在后面标出来了。

## 一、先把几个基础词说清楚

看目录之前有几个词绕不开，我之前一直是似懂非懂，这里先记下来。

- `.java` 和 `.class`：`.java` 是我们写的源代码文件；Java 要先编译成 `.class` 文件，里面是字节码（JVM 能识别的指令），再由 JVM 去跑这个 class。所以项目里源码和编译产物必须分开放。
- JVM：Java 虚拟机，跑 Java 程序的那个虚拟环境。同一份 class 在装了 JVM 的系统上都能跑。
- 包（package）：给类分组用的，代码第一行写 `package com.example.demo.controller;` 就是声明。包名一般把公司域名倒过来写，防止不同项目类名撞车。磁盘上的文件夹层级和包层级是一一对应的。
- 类（class）：Java 代码的基本单位，一个 .java 文件一般写一个主要的类。
- 注解：就是 `@` 开头的标记，比如 `@Service`、`@RestController`。它自己不干活，是给 Spring 看的：看到这个注解，就按对应的方式把这个类管起来。
- Maven：管 Java 项目的工具。两件最主要的事：一是规定好目录约定，源码、测试、资源分别放哪；二是管依赖，第三方的包（Spring、MyBatis、MySQL 驱动这些）不用自己去网上下，在配置文件里写好坐标它自动拉下来。
- 依赖：当前项目要用的别人的包。坐标就是 groupId（组织名）+ artifactId（包名）+ version（版本号），用来在仓库里唯一定位一个包。
- jar 包：编译打包后的压缩包，里面是 class 文件和资源，能跑的 Spring Boot 程序最后就是一个 jar。
- pom.xml：Maven 的配置文件，项目叫什么、依赖哪些包、什么版本、怎么打包，都写在里面。
- Bean：被 Spring 容器创建和管理的对象。加了 `@Service` 这类注解的类，对象由 Spring 建好放在容器里，用的时候由 Spring 塞进来，这个对象就叫 Bean。

## 二、Maven 的标准目录（所有 Java 项目的底子）

不管是普通 Maven 工程还是 Spring Boot，目录底子都是 Maven 规定的这一套。之前我以为文件夹是开发者随便建的，其实是强制约定，大家都按这个来，换个项目一眼就能看懂结构。

```
my-project/
├── src/
│   ├── main/                  # 主程序，最后会打进交付包
│   │   ├── java/              # Java 源代码
│   │   │   └── com/example/demo/
│   │   └── resources/         # 配置文件、XML、静态资源这些非代码文件
│   └── test/                  # 测试代码，不打进最终包
│       ├── java/
│       └── resources/
├── target/                    # 编译产物，class 文件和打好的 jar 都在这
├── pom.xml
├── .gitignore
└── README.md
```

挨个说：

- `src/main/java`：业务源码都在这，包结构对应文件夹。
- `src/main/resources`：放配置文件、MyBatis 的 XML、静态页面图片这些。打包的时候这里的文件会原样复制进 jar 的根目录，程序运行时能读到。
- `src/test/java`：单元测试代码，方法上加 `@Test` 就能被测试框架跑起来。测试只是开发阶段自检用的，不跟着交付包出去。
- `src/test/resources`：测试专用配置，比如连测试库的配置，和正式配置隔开。
- `target`：Maven 自动生成的编译输出目录，一般不手动改，也会在 .gitignore 里忽略。
- `pom.xml`：前面说过了，Maven 核心配置。
- `.gitignore`：写哪些文件不提交到 Git，常见的是 target、日志。
- `README.md`：项目说明，怎么启动、端口多少、依赖什么中间件。

两个我一开始没想通的设计：

1. 为什么 main 和 test 分开？测试代码不是交付功能，分开之后打包可以自动剔除，包更小更干净，测试配置也不会影响正式环境。
2. 为什么源码和产物分开？.java 是人改的，target 里的 class 是机器生成的；分开之后删掉 target 重新编译就行，不会动到源码。

有的项目根目录还会有 `docs/`（文档）、`sql/`（建表语句和初始化脚本）、`logs/`（运行日志，一般忽略掉）。

## 三、Spring Boot 项目（我现在见得最多的单体项目）

单体就是所有功能打在一个程序里，一个 jar 跑起来。Spring Boot 在上面那套 Maven 目录基础上，把 java 里的代码按层分包。

### 3.1 目录树

```
spring-boot-demo/
├── src/main/
│   ├── java/com/example/demo/
│   │   ├── DemoApplication.java      # 启动类，程序入口
│   │   ├── controller/               # 控制层
│   │   ├── service/                  # 业务层
│   │   │   └── impl/                 # 业务层实现类
│   │   ├── mapper/                   # 数据访问层，操作数据库
│   │   ├── entity/                   # 和数据库表对应的实体类
│   │   ├── dto/                      # 接收前端入参
│   │   ├── vo/                       # 返回给前端的出参
│   │   ├── config/                   # 配置类
│   │   ├── common/                   # 公共的东西：统一返回、常量、枚举
│   │   ├── util/                     # 工具类
│   │   ├── exception/                # 自定义异常
│   │   ├── handler/                  # 全局异常处理
│   │   ├── aspects/                   # AOP 切面
│   │   ├── filter/                   # 过滤器
│   │   └── interceptor/              # 拦截器
│   └── resources/
│       ├── application.yml           # 主配置
│       ├── application-dev.yml       # 开发环境配置
│       ├── application-prod.yml      # 生产环境配置
│       ├── bootstrap.yml              # 引导配置，配配置中心时才用
│       ├── mapper/                    # MyBatis XML
│       ├── static/                   # JS、CSS、图片
│       ├── templates/                 # 页面模板
│       └── logback-spring.xml         # 日志配置
└── pom.xml
```

### 3.2 启动类

根包下面那个带 `@SpringBootApplication` 的类，`main` 方法就是入口，跑它 Spring Boot 容器就起来了。

```java
@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

注意一点：这个注解默认扫描启动类所在包和它的子包，所以启动类要放在根包位置，下面的类才会被 Spring 找到。

### 3.3 各个包是干嘛的

**controller（控制层）**

接 HTTP 请求的。前端访问一个 URL，先到对应 controller 的方法，接收参数、做基本校验，然后调 service，最后把结果返回成 JSON。常用注解 `@RestController`（返回值直接写成 JSON）、`@GetMapping`/`@PostMapping`（声明接口路径）。

规矩：controller 里别写复杂业务，只做"接请求 → 调 service → 返回"。

**service（业务层）**

真正的业务规则在这。比如下单要扣库存、生成订单、扣余额，余额不足就拒绝，这种判断和组合操作写在 service；事务也一般加在 service 方法上。事务就是一组操作要么全成功要么全回滚，不会出现扣了库存却没生成订单的中间状态。注解 `@Service`。

常见写法是接口放 service 包，实现类放 service/impl。我一开始疑惑为什么非要多写个接口，查了下大概是：上层只依赖接口，以后换实现不影响调用方；Spring 的事务、日志这些增强是基于代理做的，有接口方便生成代理；测试的时候也能用模拟实现代替真实实现。

**mapper（数据访问层）**

只负责和数据库打交道，增删改查（CRUD：Create 增、Read 查、Update 改、Delete 删）。MyBatis 系叫 mapper，JPA 叫 repository，老 JDBC 项目叫 dao，本质一回事。注解 `@Mapper` 或 `@Repository`。

这一层不写业务判断，只提供数据读写。SQL 要么写在接口注解里，要么写在 resources/mapper 下对应的 XML 里。

**entity（实体类）**

和数据库表一一对应的 Java 对象，表里什么字段，类里就什么属性。MyBatis-Plus 里 `@TableName("user")` 指定表名，`@TableId` 指定主键。实体类是内部用的，一般不直接返回给前端，免得密码这种敏感字段露出去。

**dto（入参对象）**

专门接前端提交的数据，比如新增用户传的用户名、密码、手机号，封成一个类。比传一堆零散参数清楚，也好做参数校验。

**vo（出参对象）**

专门组装返回给前端的数据。比如查用户不返回密码，只给昵称、头像、手机号。dto 管进，vo 管出，entity 管数据库映射，三者分开就是不把内部表结构直接暴露给外面。

**config（配置类）**

用 Java 代码做框架集成配置，比如 Redis 配置、跨域（CORS，浏览器允许跨域访问的规则）、安全配置、第三方客户端的 Bean 注册。注解 `@Configuration`、`@Bean`（把方法返回的对象注册成 Bean）。

和 resources 里 yml 的区别：yml 写的是参数值（端口、连接地址），config 写的是代码形式的装配规则（建什么对象、对象怎么组装）。

**common（公共内容）**

多个业务都要用的通用代码：统一返回结果 Result（状态码 code、提示 message、数据 data，所有接口返回格式统一，前端好处理）、常量、枚举（比如订单状态：待付款、已发货、已完成）。

**util（工具类）**

没有业务含义的通用辅助方法，字符串处理、日期格式化、加密、JSON 转换这类，方法一般是静态的。

**exception / handler（异常处理）**

exception 放自定义异常，比如 BusinessException，带错误码和提示信息。handler 是全局异常处理器，注解 `@RestControllerAdvice`，程序抛异常后由它统一捕获，转成固定格式的 JSON 返回，避免把一堆报错堆栈直接甩给前端。

**aspects（AOP 切面）**

AOP 就是把多个业务里都要做的横切逻辑抽出来统一处理，比如访问日志、操作记录、权限校验、耗时统计。注解 `@Aspect`，在方法前后自动插入这段逻辑，业务代码里不用重复写。

**filter / interceptor（过滤器、拦截器）**

都是请求进来时先过的一道关卡，层级不同：filter 是 Servlet 层面的，在请求进 Spring 之前处理，比如编码、跨域预检；interceptor 是 Spring MVC 层面的，在 controller 方法前后拦截，比如登录校验、权限判断。

### 3.4 resources 里的文件

- `application.yml`（或 application.properties）：主配置，端口、数据库连接、Redis、日志级别。yml 靠缩进分层，properties 用 key=value 平铺，两种等价。
- `application-dev.yml` / `application-prod.yml`：分环境配置，dev 开发、prod 生产，还可以有 test。主配置里 `spring.profiles.active=dev` 指定当前用哪套，避免开发连错库。
- `bootstrap.yml`：容器启动早期加载，主要是连配置中心时写中心地址、应用名。单体一般用不上。
- `mapper/`：MyBatis XML，SQL 和结果集映射写这，和 mapper 接口通过命名空间对应。
- `static/`：直接给浏览器访问的 JS、CSS、图片、纯 HTML。
- `templates/`：服务端渲染的页面模板，Thymeleaf、Freemarker 这些。前后端分离之后这俩目录基本不用。
- `logback-spring.xml`：日志格式、保存路径、保留天数、各级别输出规则。

### 3.5 跟着一个接口走一遍

拿 `GET /user/get?id=1` 举例，顺着目录走：

1. 前端请求到 UserController 的对应方法，收到 id，做基本校验。
2. Controller 调 UserService.getUserById(id)，实际跑的是 UserServiceImpl 里的方法。
3. Service 判断参数合法不合法、组装查询条件，该加事务就加，然后调 mapper。
4. UserMapper 按 XML 里的 SQL 查 user 表，结果封成 User 实体返回。
5. Service 把实体转成 UserVO（去掉密码），返回给 controller。
6. Controller 把 VO 序列化成 JSON 响应给前端。

调用方向是单向的：Controller → Service → Mapper → 数据库。不能 controller 直接调 mapper，也不能 mapper 反过来调 service，不然分层就乱了。

## 四、Spring Cloud 微服务工程（目前只搭过 Demo，理解记到哪算哪）

微服务就是把一个大系统按业务拆成多个独立跑的小服务，用户服务、订单服务、商品服务各是各的，有自己的代码、数据库、启动进程，服务之间走网络互相调用。Spring Cloud 就是这套微服务的开发框架。

它和 Spring Boot 的关系我理了一阵：Spring Boot 是快速搭单个 Web 应用的；Spring Cloud 是架在 Spring Boot 之上做服务治理的。微服务里每个服务本身就是一个独立的 Spring Boot 应用，所以前面那套分层目录，在每个服务内部原样再来一遍。

### 4.1 整体目录（Maven 多模块）

最外层是个父工程，只做统一管理，下面挂一堆子模块：

```
cloud-project/
├── pom.xml                        # 父 POM：管版本、依赖、子模块列表
├── cloud-common/                  # 公共模块
│   ├── pom.xml
│   └── src/main/java/com/example/common/
│       ├── result/                # 统一返回 Result
│       ├── exception/
│       ├── entity/
│       ├── util/
│       └── constant/
├── cloud-api/                     # 可选：跨服务调用的 Feign 接口和 DTO
├── cloud-gateway/                 # 网关，外部请求的统一入口
├── cloud-user-service/            # 用户服务（内部又是一套 Spring Boot 目录）
├── cloud-order-service/            # 订单服务
├── cloud-product-service/          # 商品服务
├── docs/
└── sql/
```

### 4.2 父工程是干嘛的

父工程不放业务代码，src 一般是空的，就一个 pom.xml，干三件事：

1. 聚合子模块：`<modules>` 里列出所有子模块，构建父工程时一起编译打包。
2. 统一版本：用 `<dependencyManagement>` 和 BOM（依赖版本清单，一个集中管一组包版本号的 pom，import 进来之后引用这些包就不用各写各的版本）锁住 Boot、Cloud、Alibaba 及组件版本，避免版本打架。
3. 公共依赖下沉：所有服务都要用的包（比如 Lombok，一个简化实体类 getter/setter 的工具）写在父工程，子模块直接继承。

继承链是：官方 spring-boot-starter-parent（管 Boot 默认配置）→ 自己的父 POM（管 Cloud 版本和全局依赖）→ 各个子模块。

### 4.3 各模块职责

- **cloud-common**：所有服务共享的通用代码，Result、全局异常、公共实体、工具类、常量。别的服务在自己 pom 里引这个模块就能复用，不用复制一份。
- **cloud-api**（可选）：跨服务调用的接口定义。Feign 接口声明"调哪个服务的哪个接口"，加上跨服务传的 DTO。订单服务要调用户服务，依赖这个模块，用接口形式发远程调用，不用自己拼 HTTP 请求。
- **cloud-gateway**：网关，系统统一入口。路由转发（按路径把请求分给对应服务）、统一鉴权（登录校验）、限流（并发太高时压住，防止服务被打垮）、跨域、日志监控。外部客户端不直接找业务服务，全走网关。
- **cloud-xxx-service**：业务服务，用户、订单、商品各干各的。每个服务有自己的启动类，能单独启动、单独打包；一般各连各的数据库，不直接连别人的库。

### 4.4 几个微服务组件（我目前的理解）

- **注册中心**（Nacos、Eureka）：服务启动时把自己的地址登记到注册中心；网关要调某个服务时，先从注册中心拿到可用服务列表再转发。
- **配置中心**（Nacos Config 等）：各服务配置集中存到一台服务器上，改配置不用重新打包发版。本地只留 bootstrap.yml 写连接信息。
- **OpenFeign**：声明式 HTTP 客户端。调用方写个带注解的接口，Feign 负责拼请求、发请求、接响应，网络细节藏起来。
- **Gateway**：就是上面说的网关。

### 4.5 跟着下单流程走一遍

客户端提交 `POST /order/create`：

1. 先到网关，网关校验登录、判断限流，按 `/order/**` 路径转发给订单服务。
2. 订单服务 controller 接请求，调订单 service。
3. 订单 service 要确认用户、扣库存，通过 OpenFeign 分别调用户服务、商品服务，接口定义在 cloud-api 里。
4. 被调的服务各自走自己的 Controller → Service → Mapper → 数据库，把结果返回。
5. 订单服务汇总生成订单，用 common 里的 Result 包装，沿网关返回给客户端。

## 五、容易搞混的几个点（记下来防再混）

**mapper / dao / repository**：都是数据访问层，只是技术栈不同叫法不同。MyBatis 系叫 mapper，JPA 叫 repository，老 JDBC 叫 dao，干的事一样。

**entity / dto / vo**：entity 对应数据库表，在程序内部流转；dto 是前端进来的入参；vo 是出去的出参。分开是为了不把表结构直接暴露给外部，也方便按场景裁字段。

**service 为什么接口 + 实现类**：见 3.3 service 那段，主要是面向接口、方便代理和测试。

**main 和 test 为什么分开**：见第二章。

**Spring Boot 和 Spring Cloud**：Boot 管单个应用怎么快速搭起来；Cloud 管多个服务之间怎么注册发现、怎么调、怎么走网关、怎么统一配置。Cloud 的每个服务还是 Boot 应用。

## 六、我现在拿到一个项目的阅读顺序

1. 先看根目录 README，知道项目干嘛的、端口、依赖什么中间件。
2. 看 pom.xml，判断是单体还是多模块，引了哪些框架和版本。
3. 找启动类，确认根包位置。
4. 看配置文件，端口、数据库、注册中心这些基础信息。
5. 挑一条接口，从 controller 跟着 service 走到 mapper，这是理解项目最快的办法。
6. 最后再看 config、common、exception、aspect 这些支撑代码。

## 七、还没吃透的地方

- AOP 切面的代理机制细节，只知道大概能在方法前后插逻辑，具体怎么生成代理的还没看源码。
- 配置中心和注册中心在 Nacos 里具体怎么配、服务下线和重新注册的流程，搭 Demo 时跑通过一次，原理还得再补。
- 多模块之间依赖循环的问题还没遇到过，后面看别人项目时留意。
