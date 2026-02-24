package com.college.plms.security.oauth2;

import com.college.plms.model.Role;
import com.college.plms.model.User;
import com.college.plms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        System.out.println("OAuth2: Loading user...");
        OAuth2User oAuth2User = super.loadUser(userRequest);
        System.out.println("OAuth2 Attributes: " + oAuth2User.getAttributes());
        return processOAuth2User(oAuth2User);
    }

    private OAuth2User processOAuth2User(OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            // Update existing user if needed
            User user = userOptional.get();
            if (user.getFullName() == null) {
                user.setFullName(name);
                userRepository.save(user);
            }
        } else {
            // Register new user as STUDENT
            User user = new User();
            user.setFullName(name);
            user.setEmail(email);
            user.setRole(Role.STUDENT);
            user.setStatus("ACTIVE");
            // No password for OAuth2 users
            userRepository.save(user);
        }

        return oAuth2User;
    }
}
