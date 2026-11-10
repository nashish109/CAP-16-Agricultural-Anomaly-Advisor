package com.agrisense;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AgrisenseApplication {

    public static void main(String[] args) {
        SpringApplication.run(AgrisenseApplication.class, args);
    }
}
