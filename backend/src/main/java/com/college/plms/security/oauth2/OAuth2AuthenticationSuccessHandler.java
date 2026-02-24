package com.college.plms.security.oauth2;

import com.college.plms.security.JwtUtils;
import com.college.plms.security.UserDetailsImpl;
import com.college.plms.model.User;
import com.college.plms.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        System.out.println("OAuth2: Authentication success handler invoked.");
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        System.out.println("OAuth2: User attributes: " + oAuth2User.getAttributes());
        String email = oAuth2User.getAttribute("email");
        System.out.println("OAuth2: Extracted email: " + email);

        User user = userRepository.findByEmail(email).orElseThrow();
        System.out.println("OAuth2: Found user in DB: " + user.getEmail());
        
        // We need to generate a JWT token. Since our JwtUtils.generateJwtToken(authentication) 
        // might expect a different structure for authentication, we can either use it directly 
        // or create a token manually if needed. 
        // Most generateJwtToken implementations use authentication.getPrincipal() which is now OAuth2User.
        
        String jwt = jwtUtils.generateJwtToken(authentication);

        String targetUrl = UriComponentsBuilder.fromUriString("/index.html")
                .queryParam("token", jwt)
                .queryParam("role", "ROLE_" + user.getRole().name())
                .queryParam("email", user.getEmail())
                .queryParam("name", user.getFullName())
                .queryParam("id", user.getId())
                .build().toUriString();

        System.out.println("OAuth2: Login Success! Redirecting to: " + targetUrl);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
