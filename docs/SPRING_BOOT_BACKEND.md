# ShastraLab Spring Boot Backend Specification

This document provides a complete specification for building a Spring Boot backend to replace the current Supabase backend.

## Technology Stack

- **Java**: 17+
- **Spring Boot**: 3.2+
- **Spring Security**: JWT-based authentication
- **Spring Data JPA**: Database access
- **PostgreSQL**: Database
- **Lombok**: Reduce boilerplate
- **MapStruct**: DTO mapping
- **OpenAPI/Swagger**: API documentation

---

## Project Structure

```
src/main/java/com/shastralab/
├── ShastraLabApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── JwtConfig.java
│   ├── CorsConfig.java
│   └── OpenApiConfig.java
├── controller/
│   ├── AuthController.java
│   ├── ProfileController.java
│   ├── SyllabusController.java
│   ├── ExamPaperController.java
│   ├── QuestionController.java
│   ├── PracticeQuestionController.java
│   ├── MockTestController.java
│   ├── SubmissionController.java
│   ├── AchievementController.java
│   ├── StreakController.java
│   └── LeaderboardController.java
├── dto/
│   ├── request/
│   │   ├── LoginRequest.java
│   │   ├── SignupRequest.java
│   │   ├── CreateSyllabusRequest.java
│   │   ├── SubmitAnswerRequest.java
│   │   └── ...
│   └── response/
│       ├── AuthResponse.java
│       ├── ProfileResponse.java
│       ├── LeaderboardResponse.java
│       └── ...
├── entity/
│   ├── User.java
│   ├── Profile.java
│   ├── UserRole.java
│   ├── Syllabus.java
│   ├── ExamPaper.java
│   ├── Question.java
│   ├── PracticeQuestion.java
│   ├── MockTest.java
│   ├── AnswerSubmission.java
│   ├── Achievement.java
│   ├── DailyPracticeStreak.java
│   └── EmailReportPreference.java
├── enums/
│   ├── AppRole.java
│   ├── SubmissionStatus.java
│   ├── Difficulty.java
│   └── ReportFrequency.java
├── exception/
│   ├── GlobalExceptionHandler.java
│   ├── ResourceNotFoundException.java
│   ├── UnauthorizedException.java
│   └── BadRequestException.java
├── repository/
│   ├── UserRepository.java
│   ├── ProfileRepository.java
│   ├── SyllabusRepository.java
│   ├── ExamPaperRepository.java
│   ├── QuestionRepository.java
│   ├── PracticeQuestionRepository.java
│   ├── MockTestRepository.java
│   ├── AnswerSubmissionRepository.java
│   ├── AchievementRepository.java
│   ├── DailyPracticeStreakRepository.java
│   └── EmailReportPreferenceRepository.java
├── security/
│   ├── JwtTokenProvider.java
│   ├── JwtAuthenticationFilter.java
│   ├── UserDetailsServiceImpl.java
│   └── CurrentUser.java
├── service/
│   ├── AuthService.java
│   ├── ProfileService.java
│   ├── SyllabusService.java
│   ├── ExamPaperService.java
│   ├── QuestionService.java
│   ├── PracticeQuestionService.java
│   ├── MockTestService.java
│   ├── SubmissionService.java
│   ├── EvaluationService.java
│   ├── AchievementService.java
│   ├── StreakService.java
│   ├── LeaderboardService.java
│   ├── OcrService.java
│   ├── AiService.java
│   └── EmailService.java
└── util/
    ├── DateUtils.java
    └── JsonUtils.java
```

---

## Entity Classes

### User.java
```java
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Profile profile;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private Set<UserRole> roles = new HashSet<>();
}
```

### Profile.java
```java
@Entity
@Table(name = "profiles")
@Data
public class Profile {
    @Id
    private UUID id;
    
    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    private User user;
    
    @Column(nullable = false)
    private String email;
    
    @Column(name = "full_name")
    private String fullName;
    
    @Column(name = "institution_name")
    private String institutionName;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
```

### UserRole.java
```java
@Entity
@Table(name = "user_roles")
@Data
public class UserRole {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppRole role = AppRole.ANALYST;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
```

### Syllabus.java
```java
@Entity
@Table(name = "syllabi")
@Data
public class Syllabus {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id")
    private UUID userId;
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "exam_type", nullable = false)
    private String examType;
    
    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> topics = new ArrayList<>();
    
    private String description;
    
    @Column(name = "is_template")
    private Boolean isTemplate = false;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
```

### ExamPaper.java
```java
@Entity
@Table(name = "exam_papers")
@Data
public class ExamPaper {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @Column(nullable = false)
    private String title;
    
    @Column(name = "exam_type", nullable = false)
    private String examType;
    
    private Integer year;
    
    @Column(name = "raw_text", nullable = false, columnDefinition = "TEXT")
    private String rawText;
    
    private String status = "pending";
    
    @Column(name = "syllabus_id")
    private UUID syllabusId;
    
    @ManyToOne
    @JoinColumn(name = "syllabus_id", insertable = false, updatable = false)
    private Syllabus syllabus;
    
    @OneToMany(mappedBy = "examPaper", cascade = CascadeType.ALL)
    private List<Question> questions = new ArrayList<>();
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
```

### Question.java
```java
@Entity
@Table(name = "questions")
@Data
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @Column(name = "paper_id", nullable = false)
    private UUID paperId;
    
    @ManyToOne
    @JoinColumn(name = "paper_id", insertable = false, updatable = false)
    private ExamPaper examPaper;
    
    @Column(name = "question_number")
    private Integer questionNumber;
    
    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;
    
    private String topic;
    
    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;
    
    @Column(name = "importance_explanation", columnDefinition = "TEXT")
    private String importanceExplanation;
    
    @Column(name = "is_analyzed")
    private Boolean isAnalyzed = false;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
```

### PracticeQuestion.java
```java
@Entity
@Table(name = "practice_questions")
@Data
public class PracticeQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id")
    private UUID userId;
    
    @Column(name = "mock_test_id")
    private UUID mockTestId;
    
    @ManyToOne
    @JoinColumn(name = "mock_test_id", insertable = false, updatable = false)
    private MockTest mockTest;
    
    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;
    
    @Column(name = "question_type")
    private String questionType = "short";
    
    private String subject;
    
    private String topic;
    
    @Column(name = "max_marks")
    private Integer maxMarks = 10;
    
    @Column(name = "word_limit")
    private Integer wordLimit;
    
    @Column(name = "model_answer", columnDefinition = "TEXT")
    private String modelAnswer;
    
    @Type(JsonType.class)
    @Column(name = "key_points", columnDefinition = "jsonb")
    private List<String> keyPoints;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
```

### MockTest.java
```java
@Entity
@Table(name = "mock_tests")
@Data
public class MockTest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id")
    private UUID userId;
    
    @Column(nullable = false)
    private String title;
    
    private String description;
    
    @Column(name = "exam_type")
    private String examType = "UPSC";
    
    private String subject;
    
    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes;
    
    @Column(name = "is_template")
    private Boolean isTemplate = false;
    
    @OneToMany(mappedBy = "mockTest", cascade = CascadeType.ALL)
    private List<PracticeQuestion> questions = new ArrayList<>();
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
```

### AnswerSubmission.java
```java
@Entity
@Table(name = "answer_submissions")
@Data
public class AnswerSubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @Column(name = "question_id")
    private UUID questionId;
    
    @ManyToOne
    @JoinColumn(name = "question_id", insertable = false, updatable = false)
    private PracticeQuestion practiceQuestion;
    
    @Column(name = "submission_type")
    private String submissionType = "text";
    
    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText;
    
    @Column(name = "answer_image_url")
    private String answerImageUrl;
    
    private String status = "pending";
    
    private Double score;
    
    @Column(name = "max_score")
    private Integer maxScore;
    
    @Column(name = "overall_feedback", columnDefinition = "TEXT")
    private String overallFeedback;
    
    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> strengths;
    
    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> improvements;
    
    @Column(name = "format_suggestions", columnDefinition = "TEXT")
    private String formatSuggestions;
    
    @Column(name = "model_comparison", columnDefinition = "TEXT")
    private String modelComparison;
    
    @Type(JsonType.class)
    @Column(name = "paragraph_analysis", columnDefinition = "jsonb")
    private Object paragraphAnalysis;
    
    @Column(name = "evaluated_at")
    private LocalDateTime evaluatedAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
```

### Achievement.java
```java
@Entity
@Table(name = "achievements", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "achievement_key"})
})
@Data
public class Achievement {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @Column(name = "achievement_key", nullable = false)
    private String achievementKey;
    
    @Column(name = "unlocked_at")
    private LocalDateTime unlockedAt = LocalDateTime.now();
}
```

### DailyPracticeStreak.java
```java
@Entity
@Table(name = "daily_practice_streaks")
@Data
public class DailyPracticeStreak {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;
    
    @Column(name = "current_streak")
    private Integer currentStreak = 0;
    
    @Column(name = "longest_streak")
    private Integer longestStreak = 0;
    
    @Column(name = "last_practice_date")
    private LocalDate lastPracticeDate;
    
    @Column(name = "freeze_count")
    private Integer freezeCount = 0;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
```

### EmailReportPreference.java
```java
@Entity
@Table(name = "email_report_preferences")
@Data
public class EmailReportPreference {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;
    
    @Column(nullable = false)
    private String email;
    
    @Enumerated(EnumType.STRING)
    private ReportFrequency frequency = ReportFrequency.WEEKLY;
    
    @Column(name = "is_enabled")
    private Boolean isEnabled = true;
    
    @Column(name = "last_sent_at")
    private LocalDateTime lastSentAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
```

---

## Enums

### AppRole.java
```java
public enum AppRole {
    ADMIN,
    ANALYST,
    VIEWER
}
```

### Difficulty.java
```java
public enum Difficulty {
    EASY,
    MEDIUM,
    HARD
}
```

### ReportFrequency.java
```java
public enum ReportFrequency {
    DAILY,
    WEEKLY,
    MONTHLY
}
```

---

## REST API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user |
| POST | `/login` | Authenticate user |
| POST | `/logout` | Invalidate token |
| GET | `/me` | Get current user |

### Profiles (`/api/profiles`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get current user profile |
| PUT | `/me` | Update current user profile |

### Syllabi (`/api/syllabi`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user's syllabi |
| GET | `/templates` | List template syllabi |
| GET | `/{id}` | Get syllabus by ID |
| POST | `/` | Create syllabus |
| PUT | `/{id}` | Update syllabus |
| DELETE | `/{id}` | Delete syllabus |
| POST | `/from-template/{templateId}` | Create from template |

### Exam Papers (`/api/exam-papers`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user's papers |
| GET | `/{id}` | Get paper by ID |
| POST | `/` | Create paper |
| POST | `/{id}/extract-questions` | Extract questions using AI |
| DELETE | `/{id}` | Delete paper |

### Questions (`/api/questions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List analyzed questions |
| GET | `/{id}` | Get question by ID |
| POST | `/{id}/analyze` | Analyze question with AI |
| GET | `/by-paper/{paperId}` | Get questions by paper |
| GET | `/stats` | Get question statistics |

### Practice Questions (`/api/practice-questions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List practice questions |
| GET | `/{id}` | Get by ID |
| POST | `/` | Create practice question |
| PUT | `/{id}` | Update |
| DELETE | `/{id}` | Delete |

### Mock Tests (`/api/mock-tests`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List mock tests |
| GET | `/templates` | List templates |
| GET | `/{id}` | Get by ID |
| POST | `/` | Create mock test |
| PUT | `/{id}` | Update |
| DELETE | `/{id}` | Delete |
| GET | `/{id}/questions` | Get test questions |

### Submissions (`/api/submissions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user's submissions |
| GET | `/{id}` | Get submission by ID |
| POST | `/` | Submit answer |
| POST | `/{id}/evaluate` | Evaluate with AI |
| GET | `/stats` | Get submission statistics |
| GET | `/by-question/{questionId}` | Get by question |

### Achievements (`/api/achievements`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get user achievements |
| POST | `/check` | Check & unlock achievements |

### Streaks (`/api/streaks`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get current streak |
| POST | `/record` | Record practice session |
| POST | `/freeze` | Use freeze |
| POST | `/recover` | Recover lost streak |

### Leaderboard (`/api/leaderboard`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get leaderboard |
| GET | `/rank` | Get user's rank |

### AI Services (`/api/ai`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ocr` | OCR handwriting |
| POST | `/ocr-pdf` | OCR PDF pages |
| POST | `/tts-summary` | Generate TTS summary |
| POST | `/video-feedback` | Generate video storyboard |

---

## Security Configuration

### SecurityConfig.java
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/leaderboard").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "https://your-frontend-domain.com"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) 
            throws Exception {
        return config.getAuthenticationManager();
    }
}
```

---

## Service Examples

### EvaluationService.java
```java
@Service
@RequiredArgsConstructor
public class EvaluationService {
    
    private final AiService aiService;
    private final AnswerSubmissionRepository submissionRepository;
    
    public EvaluationResult evaluate(UUID submissionId) {
        AnswerSubmission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));
        
        PracticeQuestion question = submission.getPracticeQuestion();
        
        String prompt = buildEvaluationPrompt(question, submission);
        String aiResponse = aiService.chat(prompt);
        
        EvaluationResult result = parseEvaluationResponse(aiResponse);
        
        submission.setScore(result.getScore());
        submission.setMaxScore(question.getMaxMarks());
        submission.setOverallFeedback(result.getOverallFeedback());
        submission.setStrengths(result.getStrengths());
        submission.setImprovements(result.getImprovements());
        submission.setFormatSuggestions(result.getFormatSuggestions());
        submission.setStatus("evaluated");
        submission.setEvaluatedAt(LocalDateTime.now());
        
        submissionRepository.save(submission);
        
        return result;
    }
    
    private String buildEvaluationPrompt(PracticeQuestion question, AnswerSubmission submission) {
        // Build detailed prompt for AI evaluation
        return String.format("""
            Evaluate this UPSC Mains answer:
            
            Question: %s
            Max Marks: %d
            Word Limit: %d
            
            Student's Answer:
            %s
            
            Model Answer (if available): %s
            Key Points: %s
            
            Provide evaluation in JSON format with:
            - score (0-%d)
            - overall_feedback
            - strengths (array)
            - improvements (array)
            - format_suggestions
            """,
            question.getQuestionText(),
            question.getMaxMarks(),
            question.getWordLimit(),
            submission.getAnswerText(),
            question.getModelAnswer(),
            question.getKeyPoints(),
            question.getMaxMarks()
        );
    }
}
```

### StreakService.java
```java
@Service
@RequiredArgsConstructor
public class StreakService {
    
    private final DailyPracticeStreakRepository streakRepository;
    
    public StreakInfo getStreak(UUID userId) {
        return streakRepository.findByUserId(userId)
            .map(this::mapToStreakInfo)
            .orElse(new StreakInfo(0, 0, null, false, 0, false));
    }
    
    @Transactional
    public StreakUpdateResult recordPractice(UUID userId) {
        LocalDate today = LocalDate.now();
        
        DailyPracticeStreak streak = streakRepository.findByUserId(userId)
            .orElseGet(() -> createNewStreak(userId));
        
        if (streak.getLastPracticeDate() != null && 
            streak.getLastPracticeDate().equals(today)) {
            return new StreakUpdateResult(streak.getCurrentStreak(), 
                streak.getLongestStreak(), false);
        }
        
        if (streak.getLastPracticeDate() != null && 
            streak.getLastPracticeDate().equals(today.minusDays(1))) {
            streak.setCurrentStreak(streak.getCurrentStreak() + 1);
        } else {
            streak.setCurrentStreak(1);
        }
        
        if (streak.getCurrentStreak() > streak.getLongestStreak()) {
            streak.setLongestStreak(streak.getCurrentStreak());
        }
        
        streak.setLastPracticeDate(today);
        streak.setUpdatedAt(LocalDateTime.now());
        streakRepository.save(streak);
        
        return new StreakUpdateResult(streak.getCurrentStreak(), 
            streak.getLongestStreak(), true);
    }
    
    @Transactional
    public RecoverResult recoverStreak(UUID userId, int daysToRecover) {
        DailyPracticeStreak streak = streakRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("No streak found"));
        
        int freezesNeeded = daysToRecover * 2;
        
        if (streak.getFreezeCount() < freezesNeeded) {
            return new RecoverResult(false, "Not enough freezes", 
                streak.getFreezeCount());
        }
        
        streak.setFreezeCount(streak.getFreezeCount() - freezesNeeded);
        streak.setLastPracticeDate(LocalDate.now().minusDays(1));
        streak.setUpdatedAt(LocalDateTime.now());
        streakRepository.save(streak);
        
        return new RecoverResult(true, "Streak recovered!", 
            streak.getFreezeCount());
    }
}
```

---

## Application Properties

### application.yml
```yaml
spring:
  application:
    name: shastralab-backend
  
  datasource:
    url: jdbc:postgresql://localhost:5432/shastralab
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
  
  flyway:
    enabled: true
    locations: classpath:db/migration

jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000 # 24 hours

ai:
  api-key: ${AI_API_KEY}
  base-url: https://ai.gateway.lovable.dev/v1

file-storage:
  type: s3 # or local
  bucket: shastralab-uploads
  region: ${AWS_REGION}

email:
  api-key: ${RESEND_API_KEY}
  from: noreply@shastralab.com

server:
  port: 8080

springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
```

---

## Frontend Integration

To connect your React frontend to this Spring Boot backend:

### 1. Update API Client

Create `src/lib/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  },
  
  get: (endpoint: string) => api.fetch(endpoint),
  
  post: (endpoint: string, data: any) => 
    api.fetch(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  
  put: (endpoint: string, data: any) => 
    api.fetch(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  
  delete: (endpoint: string) => 
    api.fetch(endpoint, { method: 'DELETE' }),
};
```

### 2. Update Auth Hook

Replace Supabase auth with API calls:
```typescript
export const useAuth = () => {
  const [user, setUser] = useState(null);
  
  const signIn = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.token);
    setUser(response.user);
  };
  
  const signUp = async (email: string, password: string, fullName?: string) => {
    const response = await api.post('/auth/signup', { email, password, fullName });
    localStorage.setItem('token', response.token);
    setUser(response.user);
  };
  
  const signOut = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  return { user, signIn, signUp, signOut };
};
```

### 3. Environment Variables

Add to `.env`:
```
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## Deployment

### Docker

```dockerfile
FROM eclipse-temurin:17-jdk-alpine as build
WORKDIR /app
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src src
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DB_USERNAME=postgres
      - DB_PASSWORD=postgres
      - JWT_SECRET=your-secret-key
      - AI_API_KEY=your-ai-key
      - RESEND_API_KEY=your-resend-key
    depends_on:
      - db
  
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=shastralab
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## Next Steps

1. **Initialize Spring Boot project** using Spring Initializr
2. **Copy entity classes** and configure JPA
3. **Implement repositories** with Spring Data JPA
4. **Build services** with business logic
5. **Create REST controllers** for each resource
6. **Configure security** with JWT
7. **Set up Flyway migrations** from existing schema
8. **Integrate AI services** (OpenAI/Gemini)
9. **Deploy** using Docker/Kubernetes

This specification provides a complete blueprint for building the Spring Boot backend. Let me know if you need more details on any specific component!
