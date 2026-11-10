package com.agrisense.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String SECRET = "AgriSenseTestSecretKeyMustBeAtLeast256BitsLongForHS256!!";

    private JwtService jwtService;
    private UserDetails user;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, 60_000);
        user = User.builder()
                .username("farmer@agrisense.com")
                .password("encoded")
                .roles("USER")
                .build();
    }

    @Test
    void generateTokenIncludesSubject() {
        String token = jwtService.generateToken(Map.of("role", "USER"), user);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo("farmer@agrisense.com");
        assertThat(jwtService.isTokenValid(token, user)).isTrue();
        assertThat(jwtService.validate(token)).isTrue();
    }

    @Test
    void isTokenValidRejectsDifferentUser() {
        String token = jwtService.generateToken(user);
        UserDetails other = User.builder()
                .username("other@agrisense.com")
                .password("encoded")
                .roles("USER")
                .build();

        assertThat(jwtService.isTokenValid(token, other)).isFalse();
    }

    @Test
    void validateRejectsMalformedToken() {
        assertThat(jwtService.validate("not-a-jwt")).isFalse();
        assertThat(jwtService.validate("")).isFalse();
    }

    @Test
    void expiredTokenIsInvalid() throws InterruptedException {
        JwtService shortLived = new JwtService(SECRET, 1);
        String token = shortLived.generateToken(user);
        Thread.sleep(20);

        assertThat(shortLived.validate(token)).isFalse();
    }
}
