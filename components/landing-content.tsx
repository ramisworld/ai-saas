"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const testimonials = [
    {
        name: "Rami",
        avatar: "R",
        title: "Software Engineer",
        description: "The UI is so clean and intuitive—I was up and running in minutes. The code generation feature is a game-changer, and it's incredibly easy to use. It feels like the app knows exactly what I need. Highly recommend!"
    },
    {
        name: "Leonardo",
        avatar: "L",
        title: "Microsoft Architect",
        description: "SThe design is flawless—sleek, modern, and intuitive. The conversation bot and code generation features are incredibly easy to use. It's one of the best-designed tools I've ever worked with."
    },
    {
        name: "Marcelo",
        avatar: "M",
        title: "Company Director",
        description: "This platform is a joy to use. The interface is simple yet powerful, and my team picked it up instantly. The image and video tools are not only effective but also a breeze to navigate. Perfect for businesses!"
    },
    {
        name: "Sophia",
        avatar: "S",
        title: "UX Designer",
        description: "I'm very impressed by how clean and user-friendly this platform is. The image generation tool is simple yet powerful, and the interface guides you perfectly. A delight to use!"
    },
    {
        name: "Ethan",
        avatar: "E",
        title: "Data Scientist",
        description: "This app is a dream to use. The UI is so well-organized, and the music generation tool is both easy and effective. It's the perfect balance of simplicity and power. Love it!"
    }

]

export const LandingContent = () => {
    return (
        <div className="px-10 pb-20">
            <h2 className="text-center text-4xl text-white font-extrabold mb-10">
                Testimonials
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {testimonials.map((item) => (
                    <Card key={item.description} className="bg-[#192339] border-none text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-x-2">
                                <div>
                                    <p className="text-lg">{item.name}</p>
                                    <p className="text-zinc-400 text-sm">{item.title}</p>
                                </div>
                            </CardTitle>
                            <CardContent className="pt-4 px-0">
                                {item.description}
                            </CardContent>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}