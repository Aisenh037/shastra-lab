
-- First, we need to create a system user for templates
-- We'll use a specific UUID that we'll reference for template data
DO $$
DECLARE
  template_user_id UUID := '00000000-0000-0000-0000-000000000001';
  gs1_test_id UUID;
  gs2_test_id UUID;
  gs3_test_id UUID;
  essay_test_id UUID;
BEGIN
  -- Create GS Paper 1 template
  INSERT INTO public.mock_tests (id, user_id, title, description, exam_type, subject, is_template, time_limit_minutes)
  VALUES (gen_random_uuid(), template_user_id, 'UPSC GS Paper 1 - PYQ 2023', 'Previous year questions from UPSC CSE Mains 2023 - General Studies Paper 1', 'UPSC Mains', 'History, Geography, Society', true, 180)
  RETURNING id INTO gs1_test_id;

  -- GS1 Questions
  INSERT INTO public.practice_questions (user_id, mock_test_id, question_text, question_type, subject, topic, max_marks, word_limit, model_answer, key_points) VALUES
  (template_user_id, gs1_test_id, 'Discuss the role of the Arya Samaj in the socio-religious reform movements in India during the 19th century.', 'essay', 'History', 'Modern Indian History', 15, 250, 
   'The Arya Samaj, founded by Swami Dayanand Saraswati in 1875, was a pivotal socio-religious reform movement that sought to reform Hindu society. 

**Core Contributions:**
- Rejected idol worship and promoted Vedic principles
- Advocated for education of all, including women and lower castes
- Established DAV schools and Gurukuls across India
- Promoted Shuddhi movement to reconvert people to Hinduism

**Social Reforms:**
- Campaigned against child marriage and widow discrimination
- Promoted inter-caste marriages
- Fought against untouchability

**Political Impact:**
- Contributed to nationalist consciousness
- Many freedom fighters were influenced by Arya Samaj ideals
- Lala Lajpat Rai and Swami Shraddhanand were prominent members

The movement created a balance between tradition and modernity, helping reform Hindu society while maintaining cultural identity.',
   '["Founded 1875 by Swami Dayanand Saraswati", "Back to Vedas movement", "DAV schools establishment", "Shuddhi movement", "Anti-caste discrimination", "Women education advocacy", "Influenced nationalist movement"]'::jsonb),

  (template_user_id, gs1_test_id, 'Explain the formation of the Himalayas and their influence on the climate of India.', 'essay', 'Geography', 'Physical Geography', 15, 250,
   'The Himalayas, the youngest fold mountains, were formed through the collision of the Indian and Eurasian tectonic plates approximately 50 million years ago.

**Formation Process:**
- The Tethys Sea existed between the two landmasses
- The Indian plate moved northward at ~15 cm/year
- Collision caused folding and uplifting of sedimentary rocks
- Process continues today (Himalayas rise ~5mm/year)

**Climatic Influence:**

1. **Monsoon Barrier:**
   - Blocks cold Central Asian winds in winter
   - Obstructs monsoon winds, causing rainfall on southern slopes
   
2. **Temperature Regulation:**
   - Keeps the subcontinent warmer than other regions at similar latitudes
   - Creates distinct climatic zones based on altitude

3. **Precipitation Patterns:**
   - Orographic rainfall on windward sides
   - Rain shadow areas on leeward sides (Ladakh, Spiti)

4. **River Systems:**
   - Source of perennial rivers (Ganga, Brahmaputra, Indus)
   - Crucial for agriculture and water security

The Himalayas essentially define India''s climate, making the subcontinent a distinct climatic region.',
   '["Plate tectonics - Indian and Eurasian plates", "Tethys Sea sediments", "Young fold mountains", "Monsoon barrier effect", "Blocks cold Arctic winds", "Orographic rainfall", "Source of major rivers", "Altitude-based climate zones"]'::jsonb);

  -- Create GS Paper 2 template  
  INSERT INTO public.mock_tests (id, user_id, title, description, exam_type, subject, is_template, time_limit_minutes)
  VALUES (gen_random_uuid(), template_user_id, 'UPSC GS Paper 2 - PYQ 2023', 'Previous year questions from UPSC CSE Mains 2023 - Governance, Polity, IR', 'UPSC Mains', 'Polity, Governance, IR', true, 180)
  RETURNING id INTO gs2_test_id;

  -- GS2 Questions
  INSERT INTO public.practice_questions (user_id, mock_test_id, question_text, question_type, subject, topic, max_marks, word_limit, model_answer, key_points) VALUES
  (template_user_id, gs2_test_id, 'Discuss the importance of the separation of powers doctrine in the Indian Constitution. How does it differ from its application in the USA?', 'essay', 'Polity', 'Constitutional Framework', 15, 250,
   'The separation of powers doctrine divides governmental authority among three branches - Legislature, Executive, and Judiciary - to prevent concentration of power.

**Indian Application:**

1. **Functional Overlap:**
   - Parliamentary system means Executive drawn from Legislature
   - Judiciary has rule-making powers
   - President exercises legislative functions (ordinances)

2. **Constitutional Provisions:**
   - Article 50: Separation of judiciary from executive
   - Judicial review established through Articles 13, 32, 226
   - Legislature cannot interfere with judicial functions

**Comparison with USA:**

| Aspect | India | USA |
|--------|-------|-----|
| System | Parliamentary | Presidential |
| Executive | Part of Legislature | Separate from Congress |
| Checks | More flexible | Strict separation |
| Head | Nominal (President) | Real (President) |

**Key Differences:**
- USA follows rigid separation; India follows functional separation
- American President not responsible to Congress; Indian PM responsible to Lok Sabha
- Indian system allows greater coordination between branches

India adopted a modified version suitable for parliamentary democracy while maintaining essential checks and balances.',
   '["Montesquieu doctrine", "Three organs of government", "Parliamentary vs Presidential", "Article 50", "Judicial review", "Checks and balances", "Flexible separation in India", "Executive accountability"]'::jsonb),

  (template_user_id, gs2_test_id, 'Examine the role of civil society organizations in strengthening democracy in India.', 'essay', 'Governance', 'Civil Society', 10, 150,
   'Civil society organizations (CSOs) are non-governmental entities that represent citizens'' interests and play a crucial role in democratic governance.

**Roles in Strengthening Democracy:**

1. **Advocacy & Awareness:**
   - RTI movement led by NCPRI
   - Anti-corruption campaigns (India Against Corruption)
   - Environmental activism (Chipko, Narmada Bachao)

2. **Service Delivery:**
   - Healthcare, education in underserved areas
   - Disaster relief and rehabilitation
   - Rural development initiatives

3. **Watchdog Function:**
   - Monitor government actions
   - Expose corruption and maladministration
   - Election monitoring (ADR, Election Watch)

4. **Policy Input:**
   - Consultations on legislation
   - Research and data for evidence-based policy
   - Representing marginalized voices

**Challenges:**
- FCRA restrictions
- Funding constraints
- Accusations of foreign influence

CSOs bridge the gap between state and citizens, ensuring participatory democracy.',
   '["NGOs and advocacy groups", "RTI movement", "Watchdog role", "Service delivery", "Policy advocacy", "Marginalized representation", "FCRA challenges"]'::jsonb);

  -- Create GS Paper 3 template
  INSERT INTO public.mock_tests (id, user_id, title, description, exam_type, subject, is_template, time_limit_minutes)
  VALUES (gen_random_uuid(), template_user_id, 'UPSC GS Paper 3 - PYQ 2023', 'Previous year questions from UPSC CSE Mains 2023 - Economy, Environment, Security', 'UPSC Mains', 'Economy, Environment, Security', true, 180)
  RETURNING id INTO gs3_test_id;

  -- GS3 Questions
  INSERT INTO public.practice_questions (user_id, mock_test_id, question_text, question_type, subject, topic, max_marks, word_limit, model_answer, key_points) VALUES
  (template_user_id, gs3_test_id, 'Discuss the challenges faced by MSMEs in India and the government initiatives to address them.', 'essay', 'Economy', 'MSME Sector', 15, 250,
   'MSMEs (Micro, Small, and Medium Enterprises) contribute ~30% to GDP and employ 110+ million people, making them crucial for India''s economy.

**Major Challenges:**

1. **Financial Constraints:**
   - Limited access to formal credit
   - High interest rates
   - Lack of collateral

2. **Technological Gaps:**
   - Outdated machinery
   - Limited digitization
   - Low productivity

3. **Market Access:**
   - Competition from large firms and imports
   - Limited marketing capabilities
   - Supply chain inefficiencies

4. **Regulatory Burden:**
   - Complex compliance requirements
   - Multiple inspections
   - Delayed payments from buyers

**Government Initiatives:**

- **MUDRA Scheme:** Collateral-free loans up to ₹10 lakh
- **Credit Guarantee Scheme:** Covers up to 85% of credit
- **MSME Samadhaan:** Portal for delayed payment grievances
- **Technology Centers:** Skill development and technology upgrade
- **Government e-Marketplace (GeM):** Market access for government procurement
- **MSME Champions Portal:** Single window for problem resolution

The sector needs continued support for formalization, technology adoption, and market integration.',
   '["30% GDP contribution", "Credit access issues", "Technology gaps", "MUDRA loans", "Credit Guarantee Scheme", "GeM portal", "Delayed payments challenge", "Formalization need"]'::jsonb),

  (template_user_id, gs3_test_id, 'What is carbon neutrality? Discuss India''s approach towards achieving its climate commitments.', 'essay', 'Environment', 'Climate Change', 15, 250,
   'Carbon neutrality means achieving net-zero carbon emissions by balancing carbon released with carbon absorbed or offset.

**Concept Explained:**
- Total CO2 emissions = Carbon absorbed/offset
- Achieved through emission reduction + carbon sinks/offsets
- Different from "net zero" which includes all greenhouse gases

**India''s Climate Commitments:**

1. **NDC Targets (Updated 2022):**
   - 45% emission intensity reduction by 2030 (from 2005)
   - 50% non-fossil fuel capacity by 2030
   - Net zero by 2070

2. **Key Initiatives:**
   - **National Solar Mission:** 500 GW renewable by 2030
   - **Green Hydrogen Mission:** 5 MT production target
   - **PM KUSUM:** Solar for farmers
   - **FAME Scheme:** Electric vehicle promotion
   - **PLI for Solar:** Domestic manufacturing boost

3. **Challenges:**
   - Balancing development with climate goals
   - Financing transition
   - Technology dependence
   - Coal phase-out timeline

4. **India''s Position:**
   - Per capita emissions low (1.9 tons vs global 4.7)
   - Demands climate finance from developed nations
   - Advocates Common but Differentiated Responsibilities (CBDR)

India aims for sustainable development while addressing climate imperatives through a multi-pronged approach.',
   '["Net zero definition", "NDC 2022 updates", "2070 net zero target", "500 GW renewable target", "Green Hydrogen Mission", "CBDR principle", "Climate finance demand", "Per capita emissions comparison"]'::jsonb);

  -- Create Essay Paper template
  INSERT INTO public.mock_tests (id, user_id, title, description, exam_type, subject, is_template, time_limit_minutes)
  VALUES (gen_random_uuid(), template_user_id, 'UPSC Essay Paper - PYQ 2023', 'Previous year essay topics from UPSC CSE Mains 2023', 'UPSC Mains', 'Essay', true, 180)
  RETURNING id INTO essay_test_id;

  -- Essay Questions
  INSERT INTO public.practice_questions (user_id, mock_test_id, question_text, question_type, subject, topic, max_marks, word_limit, model_answer, key_points) VALUES
  (template_user_id, essay_test_id, 'Thinking is like a game; it does not begin unless there is an opposite team.', 'essay', 'Essay', 'Philosophy', 125, 1200,
   'This quote emphasizes that critical thinking flourishes through dialectical engagement - the clash of opposing ideas leads to refined understanding.

**Introduction:**
The human mind, like a dormant volcano, often requires an external trigger to erupt with creative energy. This trigger, more often than not, comes in the form of opposing viewpoints that challenge our established beliefs.

**Understanding the Quote:**
- Thinking as a competitive sport requiring opponents
- Ideas sharpen through debate and discourse
- Intellectual growth through cognitive conflict

**Historical Examples:**
- Socratic method: Learning through questioning
- Scientific progress through peer review and criticism
- Political democracy: Opposition parties strengthen governance
- Indian Independence: Different ideologies (Gandhi vs Subhas) enriched the movement

**Philosophical Perspectives:**
- Hegel''s dialectic: Thesis → Antithesis → Synthesis
- Mill''s "marketplace of ideas"
- Popper''s falsifiability principle

**Contemporary Relevance:**
- Echo chambers in social media limit opposing views
- Decline of civil discourse affects idea generation
- Need for diverse perspectives in policymaking
- AI systems trained on varied data perform better

**Counter-argument:**
- Individual contemplation also yields insights
- Meditation traditions emphasize internal dialogue
- Scientific breakthroughs sometimes come in isolation

**Synthesis:**
While solitary thinking has value, the most robust ideas emerge from intellectual competition. The "game" of thinking requires rules of fair engagement - respect, logic, and openness to being wrong.

**Conclusion:**
In an increasingly polarized world, we must preserve spaces for constructive intellectual opposition. Like a diamond formed under pressure, the brilliance of human thought emerges from the friction of competing ideas.',
   '["Dialectical thinking", "Socratic method", "Hegelian dialectic", "Marketplace of ideas", "Echo chamber problem", "Peer review in science", "Constructive opposition", "Synthesis of ideas"]'::jsonb);

END $$;
