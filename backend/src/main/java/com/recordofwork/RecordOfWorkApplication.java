package com.recordofwork;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class RecordOfWorkApplication {
    public static void main(String[] args) {
        SpringApplication.run(RecordOfWorkApplication.class, args);
    }
}
