graph TD
    A[Landing Page / Login] --> B{Has Family?}
    B -- No --> C[Create/Join Family Page]
    B -- Yes --> D[Dashboard (Home)]
    
    D --> E[Tab: Bistro (小餐馆)]
    D --> F[Tab: Memory (回忆)]
    D --> G[Tab: Playground (游乐场)]
    
    E --> E1[Menu List]
    E1 --> E2[Create Dish (Modal)]
    E1 --> E3[Order Detail]
    
    F --> F1[Photo Timeline (Public)]
    F --> F2[Private Diary (Locked)]
    
    G --> G1[Task Board]
    G --> G2[Settings / Switch Mode]