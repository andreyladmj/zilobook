-- Seed data: professionals, locations, images, professional_locations links
-- Password for all seed users: password123

-- ============ FITNESS PROFESSIONALS ============
INSERT INTO users (id, role, full_name, password_hash, email, profile_image_url, bio) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'PROFESSIONAL', 'Alex Petrov', '$2a$10$9FKFithOegALWFe0Q1SA6uAUsRyN1tUIhpl.OJaSBPIpsnm1n7RTi', 'alex.petrov@zilobook.dev', 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=400&q=80', 'Certified personal trainer with 8 years of experience in strength training and CrossFit. Specializing in body transformation and athletic performance.'),
  ('a0000001-0000-0000-0000-000000000002', 'PROFESSIONAL', 'Maria Koval', '$2a$10$9FKFithOegALWFe0Q1SA6uAUsRyN1tUIhpl.OJaSBPIpsnm1n7RTi', 'maria.koval@zilobook.dev', 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=400&q=80', 'Yoga and pilates instructor. Focused on flexibility, mindfulness, and rehabilitation. 200-hour RYT certified.'),
  ('a0000001-0000-0000-0000-000000000003', 'PROFESSIONAL', 'Dmitry Shevchenko', '$2a$10$9FKFithOegALWFe0Q1SA6uAUsRyN1tUIhpl.OJaSBPIpsnm1n7RTi', 'dmitry.shev@zilobook.dev', 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80', 'MMA and boxing coach. Former amateur champion. Trains beginners and advanced fighters alike.'),
  ('a0000001-0000-0000-0000-000000000004', 'PROFESSIONAL', 'Olena Bondar', '$2a$10$9FKFithOegALWFe0Q1SA6uAUsRyN1tUIhpl.OJaSBPIpsnm1n7RTi', 'olena.bondar@zilobook.dev', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80', 'Group fitness and TRX specialist. Energetic classes that push you to the limit while keeping things fun.')
ON CONFLICT DO NOTHING;

-- ============ BEAUTY PROFESSIONALS ============
INSERT INTO users (id, role, full_name, password_hash, email, profile_image_url, bio) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'PROFESSIONAL', 'Anna Romanova', '$2a$10$9FKFithOegALWFe0Q1SA6uAUsRyN1tUIhpl.OJaSBPIpsnm1n7RTi', 'anna.romanova@zilobook.dev', 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=400&q=80', 'Master nail artist with 6 years of experience. Specializing in gel extensions, art designs, and spa manicures.'),
  ('b0000001-0000-0000-0000-000000000002', 'PROFESSIONAL', 'Kateryna Lysenko', '$2a$10$9FKFithOegALWFe0Q1SA6uAUsRyN1tUIhpl.OJaSBPIpsnm1n7RTi', 'kateryna.lys@zilobook.dev', 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=400&q=80', 'Hair colorist and stylist. Balayage, highlights, and color correction specialist. Redken certified.'),
  ('b0000001-0000-0000-0000-000000000003', 'PROFESSIONAL', 'Svetlana Moroz', '$2a$10$9FKFithOegALWFe0Q1SA6uAUsRyN1tUIhpl.OJaSBPIpsnm1n7RTi', 'svetlana.moroz@zilobook.dev', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80', 'Makeup artist and skincare consultant. Bridal, editorial, and everyday looks. Cruelty-free products only.'),
  ('b0000001-0000-0000-0000-000000000004', 'PROFESSIONAL', 'Yulia Tkachuk', '$2a$10$9FKFithOegALWFe0Q1SA6uAUsRyN1tUIhpl.OJaSBPIpsnm1n7RTi', 'yulia.tkachuk@zilobook.dev', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80', 'Lash and brow specialist. Lamination, extensions, and microblading. Creating your perfect frame.')
ON CONFLICT DO NOTHING;

-- ============ AUTO SERVICE PROFESSIONALS ============
INSERT INTO users (id, role, full_name, password_hash, email, profile_image_url, bio) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'PROFESSIONAL', 'Viktor Melnyk', '$2a$10$9FKFithOegALWFe0Q1SA6uAUsRyN1tUIhpl.OJaSBPIpsnm1n7RTi', 'viktor.melnyk@zilobook.dev', 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=400&q=80', 'Master mechanic with 15 years of experience. Engine diagnostics, timing belts, and transmission specialist. European and Japanese cars.'),
  ('c0000001-0000-0000-0000-000000000002', 'PROFESSIONAL', 'Sergiy Kravchuk', '$2a$10$9FKFithOegALWFe0Q1SA6uAUsRyN1tUIhpl.OJaSBPIpsnm1n7RTi', 'sergiy.krav@zilobook.dev', 'https://images.unsplash.com/photo-1632823471565-1ecdf5c6da20?auto=format&fit=crop&w=400&q=80', 'Suspension and brake specialist. Certified by Bosch. Precision alignment and balancing for all vehicle types.'),
  ('c0000001-0000-0000-0000-000000000003', 'PROFESSIONAL', 'Andriy Savchenko', '$2a$10$9FKFithOegALWFe0Q1SA6uAUsRyN1tUIhpl.OJaSBPIpsnm1n7RTi', 'andriy.savch@zilobook.dev', 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=400&q=80', 'Electrical systems and AC specialist. Diagnostics with latest OBD-II equipment. Quick turnaround guaranteed.')
ON CONFLICT DO NOTHING;

-- ============ PHONES ============
INSERT INTO user_phones (user_id, phone_number, is_primary, is_verified) VALUES
  ('a0000001-0000-0000-0000-000000000001', '+380501110001', true, true),
  ('a0000001-0000-0000-0000-000000000002', '+380501110002', true, true),
  ('a0000001-0000-0000-0000-000000000003', '+380501110003', true, true),
  ('a0000001-0000-0000-0000-000000000004', '+380501110004', true, true),
  ('b0000001-0000-0000-0000-000000000001', '+380502220001', true, true),
  ('b0000001-0000-0000-0000-000000000002', '+380502220002', true, true),
  ('b0000001-0000-0000-0000-000000000003', '+380502220003', true, true),
  ('b0000001-0000-0000-0000-000000000004', '+380502220004', true, true),
  ('c0000001-0000-0000-0000-000000000001', '+380503330001', true, true),
  ('c0000001-0000-0000-0000-000000000002', '+380503330002', true, true),
  ('c0000001-0000-0000-0000-000000000003', '+380503330003', true, true)
ON CONFLICT DO NOTHING;

-- ============ LOCATIONS ============
INSERT INTO locations (id, name, title_slug, type, address, description, owner_id) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'Iron City Gym', 'iron-city-gym', 'Gym', 'Khreshchatyk St 22, Kyiv', 'Premium fitness center in the heart of Kyiv. Modern equipment, Olympic platforms, cardio zone, and group classes. Open 6 AM to 11 PM daily.', 'a0000001-0000-0000-0000-000000000001'),
  ('d0000001-0000-0000-0000-000000000002', 'CrossFit Arena', 'crossfit-arena', 'Gym', 'Velyka Vasylkivska St 100, Kyiv', 'Dedicated CrossFit box with full competition rig, assault bikes, rowers, and open floor space. Beginner-friendly intro classes available.', 'a0000001-0000-0000-0000-000000000003'),
  ('d0000001-0000-0000-0000-000000000003', 'Glow Beauty Studio', 'glow-beauty-studio', 'Saloon', 'Horodetskoho St 15, Kyiv', 'Boutique beauty salon offering hair, nails, makeup, and skincare services in a luxurious atmosphere. Only premium products used.', 'b0000001-0000-0000-0000-000000000001'),
  ('d0000001-0000-0000-0000-000000000004', 'Luxe Nails & Lashes', 'luxe-nails-lashes', 'Saloon', 'Saksahanskoho St 42, Kyiv', 'Cozy nail bar and lash studio. Perfect nails and lashes every time. Online booking available 24/7.', 'b0000001-0000-0000-0000-000000000004'),
  ('d0000001-0000-0000-0000-000000000005', 'AutoPro Service Center', 'autopro-service-center', 'Station', 'Peremohy Ave 67, Kyiv', 'Full-service auto repair shop. Engine, suspension, brakes, electrics, AC, and diagnostics. All European and Japanese brands.', 'c0000001-0000-0000-0000-000000000001'),
  ('d0000001-0000-0000-0000-000000000006', 'QuickFix Garage', 'quickfix-garage', 'Station', 'Zhylianska St 88, Kyiv', 'Fast oil changes, tire service, and brake jobs. Walk-ins welcome. Average service time under 2 hours.', 'c0000001-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- ============ LOCATION IMAGES ============
INSERT INTO location_images (location_id, image_url, display_order) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80', 0),
  ('d0000001-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1200&q=80', 1),
  ('d0000001-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=80', 2),
  ('d0000001-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1200&q=80', 0),
  ('d0000001-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80', 1),
  ('d0000001-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80', 0),
  ('d0000001-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80', 1),
  ('d0000001-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80', 2),
  ('d0000001-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80', 0),
  ('d0000001-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1200&q=80', 1),
  ('d0000001-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80', 0),
  ('d0000001-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80', 1),
  ('d0000001-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80', 0)
ON CONFLICT DO NOTHING;

-- ============ LINK PROFESSIONALS TO LOCATIONS ============
-- Iron City Gym: Alex (owner), Maria, Olena
INSERT INTO professional_locations (professional_id, location_id, role_description) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'Head Trainer & Owner'),
  ('a0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001', 'Yoga & Pilates Instructor'),
  ('a0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000001', 'Group Fitness Coach')
ON CONFLICT DO NOTHING;

-- CrossFit Arena: Dmitry (owner), Alex, Olena
INSERT INTO professional_locations (professional_id, location_id, role_description) VALUES
  ('a0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000002', 'Head Coach & Owner'),
  ('a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002', 'Strength Coach'),
  ('a0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000002', 'TRX & Cardio Coach')
ON CONFLICT DO NOTHING;

-- Glow Beauty Studio: Anna (owner), Kateryna, Svetlana
INSERT INTO professional_locations (professional_id, location_id, role_description) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000003', 'Nail Artist & Owner'),
  ('b0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000003', 'Hair Colorist'),
  ('b0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000003', 'Makeup Artist')
ON CONFLICT DO NOTHING;

-- Luxe Nails & Lashes: Yulia (owner), Anna
INSERT INTO professional_locations (professional_id, location_id, role_description) VALUES
  ('b0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000004', 'Lash & Brow Specialist'),
  ('b0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000004', 'Nail Technician')
ON CONFLICT DO NOTHING;

-- AutoPro Service Center: Viktor (owner), Sergiy, Andriy
INSERT INTO professional_locations (professional_id, location_id, role_description) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000005', 'Master Mechanic & Owner'),
  ('c0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000005', 'Suspension Specialist'),
  ('c0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000005', 'Electrical & AC Tech')
ON CONFLICT DO NOTHING;

-- QuickFix Garage: Sergiy (owner), Viktor
INSERT INTO professional_locations (professional_id, location_id, role_description) VALUES
  ('c0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000006', 'Lead Mechanic & Owner'),
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000006', 'Engine Specialist')
ON CONFLICT DO NOTHING;

-- ============ SAMPLE CLIENTS ============
INSERT INTO users (id, role, full_name, password_hash, email, profile_image_url) VALUES
  ('e0000001-0000-0000-0000-000000000001', 'CLIENT', 'Ivan Tarasenko', '$2a$10$9FKFithOegALWFe0Q1SA6uAUsRyN1tUIhpl.OJaSBPIpsnm1n7RTi', 'ivan.tarasenko@zilobook.dev', NULL),
  ('e0000001-0000-0000-0000-000000000002', 'CLIENT', 'Natalia Sydorenko', '$2a$10$9FKFithOegALWFe0Q1SA6uAUsRyN1tUIhpl.OJaSBPIpsnm1n7RTi', 'natalia.syd@zilobook.dev', NULL),
  ('e0000001-0000-0000-0000-000000000003', 'CLIENT', 'Oleg Marchenko', '$2a$10$9FKFithOegALWFe0Q1SA6uAUsRyN1tUIhpl.OJaSBPIpsnm1n7RTi', 'oleg.march@zilobook.dev', NULL),
  ('e0000001-0000-0000-0000-000000000004', 'CLIENT', 'Diana Voronova', '$2a$10$9FKFithOegALWFe0Q1SA6uAUsRyN1tUIhpl.OJaSBPIpsnm1n7RTi', 'diana.voronova@zilobook.dev', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO user_phones (user_id, phone_number, is_primary, is_verified) VALUES
  ('e0000001-0000-0000-0000-000000000001', '+380504440001', true, true),
  ('e0000001-0000-0000-0000-000000000002', '+380504440002', true, true),
  ('e0000001-0000-0000-0000-000000000003', '+380504440003', true, true),
  ('e0000001-0000-0000-0000-000000000004', '+380504440004', true, true)
ON CONFLICT DO NOTHING;
